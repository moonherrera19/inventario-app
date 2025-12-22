import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===========================================
// GET — INVENTARIO POR LOTE
// ===========================================
export async function GET() {
  try {
    const lotes = await prisma.inventarioLote.findMany({
      where: {
        cantidadDisponible: {
          gt: 0,
        },
      },
      include: {
        producto: true,
      },
      orderBy: [
        { fechaCaducidad: "asc" },
        { fechaEntrada: "asc" },
      ],
    });

    return NextResponse.json(lotes);
  } catch (error) {
    console.error("❌ Error inventario por lote:", error);
    return NextResponse.json(
      { error: "Error al obtener inventario por lote" },
      { status: 500 }
    );
  }
}
