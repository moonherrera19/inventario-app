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
// POST → REGISTRAR ENTRADA + LOTE + CADUCIDAD (SEGURO)
// =====================================================
export async function POST(req: Request) {
  try {
    const {
      productoId,
      cantidad,
      loteCodigo,
      fechaCaducidad,
    } = await req.json();

    if (!productoId || !cantidad || !loteCodigo) {
      return NextResponse.json(
        { error: "Producto, cantidad y lote son obligatorios" },
        { status: 400 }
      );
    }

    if (Number(cantidad) <= 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser mayor a cero" },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({
        where: { id: Number(productoId) },
      });

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      // 1️⃣ Crear lote de inventario
      const inventarioLote = await tx.inventarioLote.create({
        data: {
          productoId: Number(productoId),
          loteCodigo,
          fechaCaducidad: fechaCaducidad
            ? new Date(fechaCaducidad)
            : null,
          cantidadDisponible: Number(cantidad),
        },
      });

      // 2️⃣ Crear entrada (histórico)
      const entrada = await tx.entrada.create({
        data: {
          productoId: Number(productoId),
          cantidad: Number(cantidad),
        },
      });

      // 3️⃣ Actualizar stock total del producto
      await tx.producto.update({
        where: { id: Number(productoId) },
        data: {
          stock: {
            increment: Number(cantidad),
          },
        },
      });

      return { entrada, inventarioLote };
    });

    return NextResponse.json({
      ok: true,
      message: "Entrada registrada con lote y caducidad",
      ...resultado,
    });
  } catch (error: any) {
    console.error("Error creando entrada:", error);
    return NextResponse.json(
      { error: error.message || "Error al registrar la entrada" },
      { status: 500 }
    );
  }
}
