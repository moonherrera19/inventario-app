import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const recientes = await prisma.entrada.findMany({
      orderBy: { fecha: "desc" },
      take: 10, // 🟢 Últimos 10 movimientos
      include: {
        producto: true,
      },
    });

    return NextResponse.json(recientes);
  } catch (error) {
    console.error("Error cargando entradas recientes:", error);
    return NextResponse.json({ error: "Error en recientes" }, { status: 500 });
  }
}
