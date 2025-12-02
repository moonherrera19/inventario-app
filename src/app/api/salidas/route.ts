import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===========================================
// GET — OBTENER TODAS LAS SALIDAS
// ===========================================
export async function GET() {
  try {
    const salidas = await prisma.salida.findMany({
      orderBy: { fecha: "desc" },
      include: {
        producto: true,
      },
    });

    return NextResponse.json(salidas);
  } catch (error) {
    console.error("❌ Error GET salidas:", error);
    return NextResponse.json(
      { error: "Error al obtener salidas" },
      { status: 500 }
    );
  }
}

// ===========================================
// POST — REGISTRAR NUEVA SALIDA
// ===========================================
export async function POST(req: Request) {
  try {
    const { productoId, cantidad } = await req.json();

    // Validaciones básicas
    if (!productoId || !cantidad || cantidad <= 0) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Verificar producto
    const producto = await prisma.producto.findUnique({
      where: { id: Number(productoId) },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Validar stock suficiente
    if (producto.stock < cantidad) {
      return NextResponse.json(
        { error: "Stock insuficiente" },
        { status: 409 }
      );
    }

    // Registrar salida + restar stock
    const nuevaSalida = await prisma.$transaction(async (tx) => {
      const salida = await tx.salida.create({
        data: {
          productoId: Number(productoId),
          cantidad: Number(cantidad),
        },
      });

      await tx.producto.update({
        where: { id: Number(productoId) },
        data: {
          stock: {
            decrement: Number(cantidad),
          },
        },
      });

      return salida;
    });

    return NextResponse.json(nuevaSalida, { status: 201 });

  } catch (error) {
    console.error("❌ Error POST salidas:", error);
    return NextResponse.json(
      { error: "Error al registrar salida" },
      { status: 500 }
    );
  }
}
