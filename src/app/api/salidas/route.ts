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
        inventarioLote: true,
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
// POST — REGISTRAR SALIDA
// LÓGICA:
// - manejaLotes = false → salida directa
// - manejaLotes = true  → FIFO por lote
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

    // ==================================================
    // 🟢 CASO 1: PRODUCTO NO MANEJA LOTES
    // ==================================================
    if (!producto.manejaLotes) {

      if (producto.stock < cantidad) {
        return NextResponse.json(
          { error: "Stock insuficiente" },
          { status: 409 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1️⃣ Restar stock general
        await tx.producto.update({
          where: { id: producto.id },
          data: {
            stock: {
              decrement: Number(cantidad),
            },
          },
        });

        // 2️⃣ Registrar salida directa
        await tx.salida.create({
          data: {
            productoId: producto.id,
            cantidad: Number(cantidad),
            rancho: rancho || null,
            cultivo: cultivo || null,
          },
        });
      });

      return NextResponse.json(
        {
          ok: true,
          tipo: "DIRECTA",
          message: "Salida registrada sin lote",
        },
        { status: 201 }
      );
    }

    // ==================================================
    // 🔵 CASO 2: PRODUCTO MANEJA LOTES (FIFO)
    // ==================================================
    const resultado = await prisma.$transaction(async (tx) => {
      let restante = Number(cantidad);
      const salidasCreadas = [];

      // 1️⃣ Obtener lotes disponibles (FIFO)
      const lotes = await tx.inventarioLote.findMany({
        where: {
          productoId: producto.id,
          cantidadDisponible: { gt: 0 },
        },
        orderBy: [
          { fechaCaducidad: "asc" },
          { fechaEntrada: "asc" },
        ],
      });

      if (!lotes.length) {
        throw new Error("Producto requiere lote y no tiene disponibles");
      }

      // 2️⃣ Descontar de lotes
      for (const lote of lotes) {
        if (restante <= 0) break;

        const descontar = Math.min(lote.cantidadDisponible, restante);

        await tx.inventarioLote.update({
          where: { id: lote.id },
          data: {
            cantidadDisponible: {
              decrement: descontar,
            },
          },
        });

        const salida = await tx.salida.create({
          data: {
            productoId: producto.id,
            inventarioLoteId: lote.id,
            cantidad: descontar,
            rancho: rancho || null,
            cultivo: cultivo || null,
          },
        });

        salidasCreadas.push(salida);
        restante -= descontar;
      }

      if (restante > 0) {
        throw new Error("Stock insuficiente en lotes");
      }

      // 3️⃣ Actualizar stock general
      await tx.producto.update({
        where: { id: producto.id },
        data: {
          stock: {
            decrement: Number(cantidad),
          },
        },
      });

      return salidasCreadas;
    });

    return NextResponse.json(
      {
        ok: true,
        tipo: "LOTE",
        message: "Salida registrada por lote (FIFO)",
        salidas: resultado,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ Error POST salidas:", error);

    return NextResponse.json(
      { error: error.message || "Error al registrar salida" },
      { status: 500 }
    );
  }
}

// ===========================================
// PUT — EDITAR METADATOS (NO TOCA INVENTARIO)
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
      where: { id: Number(id) },
    });

    if (!salidaExistente) {
      return NextResponse.json(
        { error: "Salida no encontrada" },
        { status: 404 }
      );
    }

    const salida = await prisma.salida.update({
      where: { id: Number(id) },
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
