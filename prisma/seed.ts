// =====================================================
// SEED PRISMA — CREA ROLES Y EL ADMIN INICIAL
// =====================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Creamos una instancia del cliente
const prisma = new PrismaClient();

async function main() {
  console.log("👷‍♂️ Iniciando SEED...");

  // --- Crear roles (admin y trabajador) ---
  const adminRole = await prisma.rol.upsert({
    where: { nombre: "admin" },
    update: {},
    create: { nombre: "admin" },
  });

  const workerRole = await prisma.rol.upsert({
    where: { nombre: "trabajador" },
    update: {},
    create: { nombre: "trabajador" },
  });

  // --- Contraseña del admin general ---
  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.usuario.upsert({
    where: { correo: "admin@inventario.com" },
    update: {},
    create: {
      nombre: "Admin General",
      correo: "admin@inventario.com",
      password: hashedPassword,
      rolId: adminRole.id,
    },
  });

  console.log("✅ SEED COMPLETADO: Roles y Admin creados.");
}

// Ejecutamos el SEED
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
