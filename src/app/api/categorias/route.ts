import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================
// GET - Obtener todas las categorías
// ============================================
export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json(categorias);
  } catch (error) {
    console.error("❌ Error GET categorías:", error);
    return NextResponse.json(
      { message: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crear categoría
// ============================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, descripcion } = body;

    if (!nombre) {
      return NextResponse.json(
        { message: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const nueva = await prisma.categoria.create({
      data: {
        nombre,
        descripcion: descripcion || "",
      },
    });

    return NextResponse.json(nueva, { status: 201 });
  } catch (error) {
    console.error("❌ Error POST categorías:", error);
    return NextResponse.json(
      { message: "Error al crear categoría" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Actualizar categoría
// ============================================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nombre, descripcion } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID requerido" },
        { status: 400 }
      );
    }

    const updated = await prisma.categoria.update({
      where: { id },
      data: {
        nombre,
        descripcion: descripcion || "",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error PUT categoría:", error);
    return NextResponse.json(
      { message: "Error al actualizar categoría" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Eliminar categoría
// ============================================
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

    await prisma.categoria.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Categoría eliminada" });
  } catch (error) {
    console.error("❌ Error DELETE categorías:", error);
    return NextResponse.json(
      { message: "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}
