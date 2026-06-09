import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function realTimeStatus(req: Request, res: Response) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const workers = await prisma.user.findMany({
    where: { role: "WORKER" },
    select: { id: true, name: true, email: true },
  });

  const todayPunches = await prisma.clockIn.findMany({
    where: { timestamp: { gte: todayStart } },
    orderBy: { timestamp: "desc" },
  });

  // Para cada trabajador, calcular su estado actual basado en su último fichaje
  const status = workers.map((worker) => {
    const punches = todayPunches
      .filter((p) => p.userId === worker.id)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const lastPunch = punches[0] ?? null;

    let currentStatus: "IDLE" | "WORKING" | "ON_BREAK" | "FINISHED" = "IDLE";
    if (lastPunch) {
      if (lastPunch.type === "ENTRY" || lastPunch.type === "BREAK_END") currentStatus = "WORKING";
      else if (lastPunch.type === "BREAK_START") currentStatus = "ON_BREAK";
      else if (lastPunch.type === "EXIT") currentStatus = "FINISHED";
    }

    return {
      worker,
      currentStatus,
      lastPunch,
      punchCount: punches.length,
    };
  });

  res.json({ date: todayStart, status });
}

export async function getWorkers(req: Request, res: Response) {
  const workers = await prisma.user.findMany({
    where: { role: "WORKER" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  res.json({ workers });
}

const CreateUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["WORKER", "MANAGER"]).default("WORKER"),
});

export async function getUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  res.json({ users });
}

export async function createUser(req: Request, res: Response) {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const { name, email, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "El email ya está registrado" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.status(201).json({ user });
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  if (id === req.user!.userId) {
    res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
    return;
  }
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(409).json({ error: "No se puede eliminar: el usuario tiene registros de fichaje o ausencias" });
  }
}
