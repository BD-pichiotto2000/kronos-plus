import { Request, Response } from "express";
import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";

const PUNCH_LABELS: Record<string, string> = {
  ENTRY: "Entrada",
  BREAK_START: "Inicio Descanso",
  BREAK_END: "Fin Descanso",
  EXIT: "Salida",
};

export async function exportReport(req: Request, res: Response) {
  const { year, month, userId, format = "csv" } = req.query;

  const y = parseInt(year as string) || new Date().getFullYear();
  const m = parseInt(month as string) || new Date().getMonth() + 1;

  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);

  const records = await prisma.clockIn.findMany({
    where: {
      ...(userId ? { userId: userId as string } : {}),
      timestamp: { gte: from, lt: to },
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ user: { name: "asc" } }, { timestamp: "asc" }],
  });

  const rows = records.map((r) => ({
    Empleado: r.user.name,
    Email: r.user.email,
    Fecha: r.timestamp.toLocaleDateString("es-ES"),
    Hora: r.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    Tipo: PUNCH_LABELS[r.type] ?? r.type,
    Latitud: r.latitude ?? "",
    Longitud: r.longitude ?? "",
  }));

  const monthName = new Date(y, m - 1).toLocaleString("es-ES", { month: "long" });
  const filename = `kronos_${monthName}_${y}`;

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fichajes");

    // Ajustar anchos de columna
    ws["!cols"] = [
      { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
    ];

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
    return;
  }

  // Default: CSV
  const header = Object.keys(rows[0] ?? {}).join(",");
  const csvRows = rows.map((r) =>
    Object.values(r)
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header, ...csvRows].join("\n");

  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send("﻿" + csv); // BOM para Excel en español
}
