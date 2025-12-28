import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================================
// GET — Obtener todos los proveedores
// ======================================================
export async function GET() {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: "asc" },
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

// ======================================================
// POST — Crear proveedor (manual / formulario)
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      nombre,
      telefono,
      correo,
      direccion,
      rfc,
      banco,
      numeroCuenta,
      clabe,
      bancoDolares,
      numeroCuentaDolares,
      clabeDolares,
    } = body;

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { message: "El nombre del proveedor es obligatorio" },
        { status: 400 }
      );
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono || null,
        correo: correo || null,
        direccion: direccion || null,
        rfc: rfc || null,

        banco: banco || null,
        numeroCuenta: numeroCuenta || null,
        clabe: clabe || null,

        bancoDolares: bancoDolares || null,
        numeroCuentaDolares: numeroCuentaDolares || null,
        clabeDolares: clabeDolares || null,
      },
    });

    return NextResponse.json(proveedor, { status: 201 });
  } catch (error) {
    console.error("❌ Error POST proveedores:", error);
    return NextResponse.json(
      { message: "Error al crear proveedor" },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT — Actualizar proveedor
// ======================================================
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      id,
      nombre,
      telefono,
      correo,
      direccion,
      rfc,
      banco,
      numeroCuenta,
      clabe,
      bancoDolares,
      numeroCuentaDolares,
      clabeDolares,
    } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Falta el ID del proveedor" },
        { status: 400 }
      );
    }

    const proveedor = await prisma.proveedor.update({
      where: { id: Number(id) },
      data: {
        nombre,
        telefono: telefono || null,
        correo: correo || null,
        direccion: direccion || null,
        rfc: rfc || null,

        banco: banco || null,
        numeroCuenta: numeroCuenta || null,
        clabe: clabe || null,

        bancoDolares: bancoDolares || null,
        numeroCuentaDolares: numeroCuentaDolares || null,
        clabeDolares: clabeDolares || null,
      },
    });

    return NextResponse.json(proveedor);
  } catch (error) {
    console.error("❌ Error PUT proveedores:", error);
    return NextResponse.json(
      { message: "Error al actualizar proveedor" },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE — Eliminar proveedor
// /api/proveedores?id=1
// ======================================================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    await prisma.proveedor.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Proveedor eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error DELETE proveedores:", error);
    return NextResponse.json(
      { message: "Error al eliminar proveedor" },
      { status: 500 }
    );
  }
}
