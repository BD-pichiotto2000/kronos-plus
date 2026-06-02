import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const PunchSchema = z.object({
  type: z.enum(["ENTRY", "BREAK_START", "BREAK_END", "EXIT"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Orden válido de fichajes en un día
const VALID_SEQUENCE: Record<string, string[]> = {
  ENTRY: [],
  BREAK_START: ["ENTRY"],
  BREAK_END: ["BREAK_START"],
  EXIT: ["ENTRY", "BREAK_END"],
};

export async function punch(req: Request, res: Response) {
  const parsed = PunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { type, latitude, longitude } = parsed.data;
  const userId = req.user!.userId;

  // Verificar secuencia válida: obtener el último fichaje de hoy
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const lastPunch = await prisma.clockIn.findFirst({
    where: { userId, timestamp: { gte: todayStart } },
    orderBy: { timestamp: "desc" },
  });

  const lastType = lastPunch?.type ?? null;
  const requiredPriors = VALID_SEQUENCE[type];

  if (requiredPriors.length > 0 && !requiredPriors.includes(lastType as string)) {
    res.status(422).json({
      error: `No puedes registrar "${type}" en este momento. Último fichaje: ${lastType ?? "ninguno"}`,
    });
    return;
  }

  // Evitar doble fichaje del mismo tipo en el mismo día
  if (lastType === type) {
    res.status(422).json({ error: `Ya registraste "${type}" hoy` });
    return;
  }

  const clockIn = await prisma.clockIn.create({
    data: { userId, type, latitude, longitude },
  });

  res.status(201).json({ clockIn });
}

export async function myHistory(req: Request, res: Response) {
  const { year, month } = req.query;
  const userId = req.user!.userId;

  const y = parseInt(year as string) || new Date().getFullYear();
  const m = parseInt(month as string) || new Date().getMonth() + 1;

  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);

  const records = await prisma.clockIn.findMany({
    where: { userId, timestamp: { gte: from, lt: to } },
    orderBy: { timestamp: "asc" },
  });

  res.json({ records, year: y, month: m });
}

export async function allHistory(req: Request, res: Response) {
  const { year, month, userId } = req.query;

  const y = parseInt(year as string) || new Date().getFullYear();
  const m = parseInt(month as string) || new Date().getMonth() + 1;

  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);

  const records = await prisma.clockIn.findMany({
    where: {
      ...(userId ? { userId: userId as string } : {}),
      timestamp: { gte: from, lt: to },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { timestamp: "asc" },
  });

  res.json({ records, year: y, month: m });
}
