import { PrismaClient } from "@prisma/client";

declare global {
  // Evita que Prisma se reinicialice en desarrollo (Hot Reload)
  // y produzca demasiadas conexiones a la DB.
  var prisma: PrismaClient | undefined;
}

// Usa una instancia global en desarrollo.
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"], // Puedes quitar "query" si quieres menos ruido
  });

// En producción SIEMPRE crear una nueva instancia
if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
}
