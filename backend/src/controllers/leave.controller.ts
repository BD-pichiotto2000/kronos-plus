import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const CreateRequestSchema = z.object({
  type: z.enum(["VACATION", "PERSONAL_DAY"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

// Detecta conflictos con empleados incompatibles que tienen vacaciones APROBADAS
async function detectConflicts(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ hasConflict: boolean; conflictingUsers: { id: string; name: string }[] }> {
  // Obtener todos los incompatibles del empleado
  const incompatibilities = await prisma.incompatibility.findMany({
    where: {
      OR: [{ employee1Id: userId }, { employee2Id: userId }],
    },
  });

  const incompatibleIds = incompatibilities.map((inc) =>
    inc.employee1Id === userId ? inc.employee2Id : inc.employee1Id
  );

  if (incompatibleIds.length === 0) return { hasConflict: false, conflictingUsers: [] };

  // Buscar si algún incompatible tiene un período aprobado que se solapa
  const conflicts = await prisma.leaveRequest.findMany({
    where: {
      userId: { in: incompatibleIds },
      status: "APPROVED",
      AND: [
        { startDate: { lte: endDate } },
        { endDate: { gte: startDate } },
      ],
    },
    include: { employee: { select: { id: true, name: true } } },
  });

  const conflictingUsers = conflicts.map((c) => c.employee);
  return { hasConflict: conflictingUsers.length > 0, conflictingUsers };
}

export async function createRequest(req: Request, res: Response) {
  const parsed = CreateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { type, startDate: startStr, endDate: endStr, notes } = parsed.data;
  const userId = req.user!.userId;

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);

  if (endDate < startDate) {
    res.status(400).json({ error: "La fecha de fin no puede ser anterior a la de inicio" });
    return;
  }

  const { hasConflict, conflictingUsers } = await detectConflicts(userId, startDate, endDate);

  const request = await prisma.leaveRequest.create({
    data: {
      userId,
      type,
      startDate,
      endDate,
      notes,
      hasConflict,
      conflictWith: hasConflict ? JSON.stringify(conflictingUsers.map((u) => u.id)) : null,
    },
  });

  res.status(201).json({
    request,
    conflict: hasConflict
      ? {
          message: `Conflicto con: ${conflictingUsers.map((u) => u.name).join(", ")}`,
          users: conflictingUsers,
        }
      : null,
  });
}

export async function myRequests(req: Request, res: Response) {
  const requests = await prisma.leaveRequest.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ requests });
}

export async function allRequests(req: Request, res: Response) {
  const { status } = req.query;

  const requests = await prisma.leaveRequest.findMany({
    where: status ? { status: status as any } : {},
    include: {
      employee: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Para las pendientes con conflicto, enriquecer con nombres de conflictivos
  const enriched = await Promise.all(
    requests.map(async (req) => {
      if (!req.hasConflict || !req.conflictWith) return req;
      const ids: string[] = JSON.parse(req.conflictWith);
      const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });
      return { ...req, conflictingUsers: users };
    })
  );

  res.json({ requests: enriched });
}

export async function approveRequest(req: Request, res: Response) {
  const { id } = req.params;
  const managerId = req.user!.userId;

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Solicitud no encontrada" });
    return;
  }
  if (existing.status !== "PENDING") {
    res.status(409).json({ error: "La solicitud ya fue procesada" });
    return;
  }

  // Re-verificar conflictos en el momento de aprobar (datos pueden haber cambiado)
  const { hasConflict, conflictingUsers } = await detectConflicts(
    existing.userId,
    existing.startDate,
    existing.endDate
  );

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      managerId,
      hasConflict,
      conflictWith: hasConflict ? JSON.stringify(conflictingUsers.map((u) => u.id)) : null,
    },
    include: { employee: { select: { id: true, name: true } } },
  });

  res.json({
    request: updated,
    warning: hasConflict
      ? `Aprobado con conflicto. Coincide con: ${conflictingUsers.map((u) => u.name).join(", ")}`
      : null,
  });
}

export async function rejectRequest(req: Request, res: Response) {
  const { id } = req.params;
  const managerId = req.user!.userId;

  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Solicitud no encontrada" });
    return;
  }
  if (existing.status !== "PENDING") {
    res.status(409).json({ error: "La solicitud ya fue procesada" });
    return;
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "REJECTED", managerId },
  });

  res.json({ request: updated });
}

export async function manageIncompatibilities(req: Request, res: Response) {
  if (req.method === "GET") {
    const all = await prisma.incompatibility.findMany({
      include: {
        employee1: { select: { id: true, name: true } },
        employee2: { select: { id: true, name: true } },
      },
    });
    res.json({ incompatibilities: all });
    return;
  }

  if (req.method === "POST") {
    const { employee1Id, employee2Id } = req.body;
    if (!employee1Id || !employee2Id || employee1Id === employee2Id) {
      res.status(400).json({ error: "IDs inválidos" });
      return;
    }
    const [a, b] = [employee1Id, employee2Id].sort();
    const inc = await prisma.incompatibility.upsert({
      where: { employee1Id_employee2Id: { employee1Id: a, employee2Id: b } },
      update: {},
      create: { employee1Id: a, employee2Id: b },
      include: {
        employee1: { select: { id: true, name: true } },
        employee2: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ incompatibility: inc });
    return;
  }

  if (req.method === "DELETE") {
    const { id } = req.params;
    await prisma.incompatibility.delete({ where: { id } });
    res.json({ ok: true });
    return;
  }
}
