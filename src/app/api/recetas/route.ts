import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===============================
// GET – OBTENER RECETAS
// ===============================
export async function GET() {
  try {
    const recetas = await prisma.receta.findMany({
      include: {
        ingredientes: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(recetas);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener recetas" },
      { status: 500 }
    );
  }
}

// ===============================
// POST – CREAR RECETA (NO TOCA STOCK)
// ===============================
export async function POST(req: Request) {
  try {
    const { nombre, ingredientes } = await req.json();

    const nueva = await prisma.receta.create({
      data: {
        nombre,
        ingredientes: {
          create: ingredientes.map((i: any) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
          })),
        },
      },
    });

    return NextResponse.json(nueva);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear receta" },
      { status: 500 }
    );
  }
}

// ===============================
// PUT – EDITAR RECETA (MODO HISTÓRICO)
// ===============================
export async function PUT(req: Request) {
  try {
    const { id, nombre, ingredientes } = await req.json();

    // borrar ingredientes anteriores
    await prisma.recetaIngrediente.deleteMany({ where: { recetaId: id } });

    const receta = await prisma.receta.update({
      where: { id },
      data: {
        nombre,
        ingredientes: {
          create: ingredientes.map((i: any) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
          })),
        },
      },
    });

    return NextResponse.json(receta);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al editar receta" },
      { status: 500 }
    );
  }
}

// ===============================
// DELETE – BORRAR RECETA
// ===============================
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  try {
    // borrar ingredientes anteriores
await prisma.ingrediente.deleteMany({ where: { recetaId: id } });


    await prisma.receta.delete({ where: { id } });

    return NextResponse.json({ message: "Receta eliminada" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar receta" },
      { status: 500 }
    );
  }
}
