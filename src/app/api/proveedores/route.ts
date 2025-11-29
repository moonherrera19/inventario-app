import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================
// GET - Obtener todos los proveedores
// ============================================
export async function GET() {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json(proveedores);
  } catch (error) {
    console.error("❌ Error GET proveedores:", error);
    return NextResponse.json(
      { message: "Error al obtener proveedores" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crear proveedor
// ============================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, telefono, direccion } = body;

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { message: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const nuevo = await prisma.proveedor.create({
      data: {
        nombre,
        telefono: telefono || null,
        direccion: direccion || null,
      },
    });

    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error("❌ Error POST proveedores:", error);
    return NextResponse.json(
      { message: "Error al crear proveedor" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Actualizar proveedor
// ============================================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nombre, telefono, direccion } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Falta el ID del proveedor" },
        { status: 400 }
      );
    }

    const actualizado = await prisma.proveedor.update({
      where: { id },
      data: {
        nombre,
        telefono: telefono || null,
        direccion: direccion || null,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("❌ Error PUT proveedores:", error);
    return NextResponse.json(
      { message: "Error al actualizar proveedor" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Eliminar proveedor
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

    await prisma.proveedor.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Proveedor eliminado" });
  } catch (error) {
    console.error("❌ Error DELETE proveedores:", error);
    return NextResponse.json(
      { message: "Error al eliminar proveedor" },
      { status: 500 }
    );
  }
}
