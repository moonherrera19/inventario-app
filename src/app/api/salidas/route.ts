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
    const { productoId, cantidad, rancho, cultivo } = await req.json();

    if (!productoId || !cantidad || cantidad <= 0) {
      return NextResponse.json(
        { error: "Datos inválidos" },
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

    if (producto.stock < cantidad) {
      return NextResponse.json(
        { error: "Stock insuficiente" },
        { status: 409 }
      );
    }

    // Registrar salida + actualizar stock
    const nuevaSalida = await prisma.$transaction(async (tx) => {
      const salida = await tx.salida.create({
        data: {
          productoId: Number(productoId),
          cantidad: Number(cantidad),
          rancho: rancho || null,
          cultivo: cultivo || null,
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

// ===========================================
// PUT — EDITAR RANCHO / CULTIVO / CANTIDAD SIN AFECTAR STOCK
// ===========================================
export async function PUT(req: Request) {
  try {
    const { id, cantidad, rancho, cultivo } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID obligatorio" },
        { status: 400 }
      );
    }

    const salidaExistente = await prisma.salida.findUnique({
      where: { id },
    });

    if (!salidaExistente) {
      return NextResponse.json(
        { error: "Salida no encontrada" },
        { status: 404 }
      );
    }

    // *** NO MODIFICAMOS STOCK ***
    const salida = await prisma.salida.update({
      where: { id },
      data: {
        cantidad: Number(cantidad),
        rancho: rancho || null,
        cultivo: cultivo || null,
      },
    });

    return NextResponse.json(salida);

  } catch (error) {
    console.error("❌ Error PUT salidas:", error);
    return NextResponse.json(
      { error: "Error al actualizar salida" },
      { status: 500 }
    );
  }
}
