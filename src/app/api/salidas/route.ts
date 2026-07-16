import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// PUT → EDITAR SOLO LA FECHA DE UNA SALIDA
//
// IMPORTANTE:
// Este endpoint es independiente del PUT que ya existe en
// /api/salidas (route.ts de colección), el cual edita
// cantidad/rancho/cultivo y ajusta stock/lotes. Este NO.
// Este endpoint únicamente actualiza el campo `fecha` de la
// Salida. No toca Producto.stock, no toca InventarioLote,
// no recalcula FIFO, no crea ni elimina movimientos.
// =====================================================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { fecha } = await req.json();

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    if (!fecha) {
      return NextResponse.json(
        { error: "La fecha es obligatoria" },
        { status: 400 }
      );
    }

    const nuevaFecha = new Date(fecha);

    if (isNaN(nuevaFecha.getTime())) {
      return NextResponse.json(
        { error: "Fecha inválida" },
        { status: 400 }
      );
    }

    const salidaExistente = await prisma.salida.findUnique({
      where: { id: Number(id) },
    });

    if (!salidaExistente) {
      return NextResponse.json(
        { error: "Salida no encontrada" },
        { status: 404 }
      );
    }

    const salidaActualizada = await prisma.salida.update({
      where: { id: Number(id) },
      data: { fecha: nuevaFecha },
    });

    return NextResponse.json(salidaActualizada);
  } catch (error: any) {
    console.error("❌ Error PUT salida [id]:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la fecha de la salida" },
      { status: 500 }
    );
  }
}