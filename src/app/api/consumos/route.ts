import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =======================================
// GET - Todos los consumos (con lote y producto)
// =======================================
export async function GET() {
  try {
    const consumos = await prisma.consumo.findMany({
      orderBy: { id: "desc" },
      include: {
        lote: true,
        producto: true,
      },
    });

    return NextResponse.json(consumos);
  } catch (error) {
    console.error("❌ Error GET consumos:", error);
    return NextResponse.json(
      { message: "Error al obtener consumos" },
      { status: 500 }
    );
  }
}

// =======================================
// POST - Crear consumo
// =======================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { loteId, productoId, cantidad } = body;

    if (!loteId || !productoId || !cantidad) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    const nuevo = await prisma.consumo.create({
      data: {
        loteId,
        productoId,
        cantidad: Number(cantidad),
      },
      include: {
        lote: true,
        producto: true,
      }
    });

    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error("❌ Error POST consumos:", error);
    return NextResponse.json(
      { message: "Error al registrar consumo" },
      { status: 500 }
    );
  }
}

// =======================================
// PUT - Actualizar consumo
// =======================================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, loteId, productoId, cantidad } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID requerido" },
        { status: 400 }
      );
    }

    const actualizado = await prisma.consumo.update({
      where: { id },
      data: {
        loteId,
        productoId,
        cantidad: Number(cantidad),
      },
      include: {
        lote: true,
        producto: true,
      }
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("❌ Error PUT consumos:", error);
    return NextResponse.json(
      { message: "Error al actualizar consumo" },
      { status: 500 }
    );
  }
}

// =======================================
// DELETE - Eliminar consumo
// =======================================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    await prisma.consumo.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Consumo eliminado" });
  } catch (error) {
    console.error("❌ Error DELETE consumos:", error);
    return NextResponse.json(
      { message: "Error al eliminar consumo" },
      { status: 500 }
    );
  }
}
