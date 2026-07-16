import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// PUT → EDITAR SOLO LA FECHA DE UNA ENTRADA
//
// IMPORTANTE:
// Este endpoint NO toca stock, NO toca InventarioLote,
// NO recalcula nada. Únicamente actualiza el campo `fecha`
// del registro de Entrada. El resto de la entrada (producto,
// cantidad, lote) permanece exactamente igual.
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

    const entradaExistente = await prisma.entrada.findUnique({
      where: { id: Number(id) },
    });

    if (!entradaExistente) {
      return NextResponse.json(
        { error: "Entrada no encontrada" },
        { status: 404 }
      );
    }

    const entradaActualizada = await prisma.entrada.update({
      where: { id: Number(id) },
      data: { fecha: nuevaFecha },
    });

    return NextResponse.json(entradaActualizada);
  } catch (error: any) {
    console.error("❌ Error PUT entrada [id]:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la fecha de la entrada" },
      { status: 500 }
    );
  }
}