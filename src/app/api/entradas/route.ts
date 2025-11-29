import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =====================================================
// GET → LISTAR ENTRADAS
// =====================================================
export async function GET() {
  const entradas = await prisma.entrada.findMany({
    orderBy: { id: "desc" },
    include: {
      producto: true,
    },
  });

  return NextResponse.json(entradas);
}

// =====================================================
// POST → REGISTRAR ENTRADA Y SUMAR STOCK
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

    const producto = await prisma.producto.findUnique({
      where: { id: Number(productoId) },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Crear entrada
    const entrada = await prisma.entrada.create({
      data: {
        productoId: Number(productoId),
        cantidad: Number(cantidad),
      },
    });

    // SUMAR stock
    await prisma.producto.update({
      where: { id: Number(productoId) },
      data: {
        stock: producto.stock + Number(cantidad),
      },
    });

    return NextResponse.json(entrada);
  } catch (error) {
    console.error("Error creando entrada:", error);
    return NextResponse.json(
      { error: "Error al registrar la entrada" },
      { status: 500 }
    );
  }
}
