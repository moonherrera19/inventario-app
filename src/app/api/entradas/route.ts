import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================================
// GET → LISTAR ENTRADAS
// =====================================================
export async function GET() {
  try {
    const entradas = await prisma.entrada.findMany({
      orderBy: { id: "desc" },
      include: {
        producto: true,
      },
    });

    return NextResponse.json(entradas);
  } catch (error) {
    console.error("❌ Error GET entradas:", error);
    return NextResponse.json(
      { error: "Error al obtener entradas" },
      { status: 500 }
    );
  }
}

// =====================================================
// POST → REGISTRAR ENTRADA
// LÓGICA:
// - manejaLotes = false → sumar stock directo
// - manejaLotes = true  → crear InventarioLote
// =====================================================
export async function POST(req: Request) {
  try {
    const {
      productoId,
      cantidad,
      loteCodigo,
      fechaCaducidad,
    } = await req.json();

    if (!productoId || !cantidad || Number(cantidad) <= 0) {
      return NextResponse.json(
        { error: "Producto y cantidad válidos son obligatorios" },
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

    // ==================================================
    // 🟢 CASO 1: PRODUCTO NO MANEJA LOTES
    // ==================================================
    if (!producto.manejaLotes) {

      await prisma.$transaction(async (tx) => {
        // 1️⃣ Registrar entrada (histórico)
        await tx.entrada.create({
          data: {
            productoId: producto.id,
            cantidad: Number(cantidad),
          },
        });

        // 2️⃣ Sumar stock general
        await tx.producto.update({
          where: { id: producto.id },
          data: {
            stock: {
              increment: Number(cantidad),
            },
          },
        });
      });

      return NextResponse.json(
        {
          ok: true,
          tipo: "DIRECTA",
          message: "Entrada registrada sin lote",
        },
        { status: 201 }
      );
    }

    // ==================================================
    // 🔵 CASO 2: PRODUCTO MANEJA LOTES
    // ==================================================
    if (!loteCodigo) {
      return NextResponse.json(
        { error: "Lote obligatorio para este producto" },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1️⃣ Crear lote
      const inventarioLote = await tx.inventarioLote.create({
        data: {
          productoId: producto.id,
          loteCodigo,
          fechaCaducidad: fechaCaducidad
            ? new Date(fechaCaducidad)
            : null,
          cantidadDisponible: Number(cantidad),
        },
      });

      // 2️⃣ Registrar entrada
      const entrada = await tx.entrada.create({
        data: {
          productoId: producto.id,
          cantidad: Number(cantidad),
        },
      });

      // 3️⃣ Actualizar stock general
      await tx.producto.update({
        where: { id: producto.id },
        data: {
          stock: {
            increment: Number(cantidad),
          },
        },
      });

      return { entrada, inventarioLote };
    });

    return NextResponse.json(
      {
        ok: true,
        tipo: "LOTE",
        message: "Entrada registrada con lote",
        ...resultado,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ Error POST entradas:", error);
    return NextResponse.json(
      { error: error.message || "Error al registrar la entrada" },
      { status: 500 }
    );
  }
}
