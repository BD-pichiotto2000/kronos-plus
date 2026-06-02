import { Request, Response } from "express";
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
