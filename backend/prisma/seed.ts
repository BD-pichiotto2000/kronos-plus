import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding KRONOS+ database...");

  const managerHash = await bcrypt.hash("manager123", 12);
  const workerHash = await bcrypt.hash("worker123", 12);

  const manager = await prisma.user.upsert({
    where: { email: "gerente@empresa.com" },
    update: {},
    create: { name: "Gerente Principal", email: "gerente@empresa.com", passwordHash: managerHash, role: "MANAGER" },
  });

  const ana = await prisma.user.upsert({
    where: { email: "ana@empresa.com" },
    update: {},
    create: { name: "Ana García", email: "ana@empresa.com", passwordHash: workerHash, role: "WORKER" },
  });

  const luis = await prisma.user.upsert({
    where: { email: "luis@empresa.com" },
    update: {},
    create: { name: "Luis Martínez", email: "luis@empresa.com", passwordHash: workerHash, role: "WORKER" },
  });

  const marta = await prisma.user.upsert({
    where: { email: "marta@empresa.com" },
    update: {},
    create: { name: "Marta Ruiz", email: "marta@empresa.com", passwordHash: workerHash, role: "WORKER" },
  });

  // Definir incompatibilidades: Ana y Luis no pueden coincidir en vacaciones
  const [e1, e2] = [ana.id, luis.id].sort();
  await prisma.incompatibility.upsert({
    where: { employee1Id_employee2Id: { employee1Id: e1, employee2Id: e2 } },
    update: {},
    create: { employee1Id: e1, employee2Id: e2 },
  });

  console.log("Seed completado:");
  console.log("  Gerente:  gerente@empresa.com / manager123");
  console.log("  Trabajador 1: ana@empresa.com / worker123");
  console.log("  Trabajador 2: luis@empresa.com / worker123 (incompatible con Ana)");
  console.log("  Trabajador 3: marta@empresa.com / worker123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
