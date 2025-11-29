import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =====================================================
// GET → Listar salidas
// =====================================================
export async function GET() {
  const salidas = await prisma.salida.findMany({
    orderBy: { id: "desc" },
    include: {
      producto: true,
    },
  });

  return NextResponse.json(salidas);
}

// =====================================================
// POST → Registrar una salida y restar stock
// =====================================================
export async function POST(req: Request) {
  try {
    const { productoId, cantidad } = await req.json();

    if (!productoId || !cantidad) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Buscar producto
    const producto = await prisma.producto.findUnique({
      where: { id: Number(productoId) },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    if (producto.stock < cantidad) {
      return NextResponse.json(
        { error: "No hay suficiente stock para esta salida" },
        { status: 400 }
      );
    }

    // Registrar salida
    const salida = await prisma.salida.create({
      data: {
        productoId: Number(productoId),
        cantidad: Number(cantidad),
      },
    });

    // Restar stock
    await prisma.producto.update({
      where: { id: Number(productoId) },
      data: {
        stock: producto.stock - cantidad,
      },
    });

    return NextResponse.json(salida);
  } catch (error) {
    console.error("Error creando salida:", error);
    return NextResponse.json(
      { error: "Error al registrar la salida" },
      { status: 500 }
    );
  }
}
