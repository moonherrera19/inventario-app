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
// POST — REGISTRAR SALIDA (FIFO AUTOMÁTICO)
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

    // 🔁 FIFO AUTOMÁTICO
    const resultado = await prisma.$transaction(async (tx) => {
      let restante = Number(cantidad);
      const salidasCreadas = [];

      // 1️⃣ Obtener lotes disponibles ordenados por caducidad
      const lotes = await tx.inventarioLote.findMany({
        where: {
          productoId: Number(productoId),
          cantidadDisponible: { gt: 0 },
        },
        orderBy: [
          { fechaCaducidad: "asc" },
          { fechaEntrada: "asc" },
        ],
      });

      for (const lote of lotes) {
        if (restante <= 0) break;

        const descontar = Math.min(lote.cantidadDisponible, restante);

        // 2️⃣ Actualizar lote
        await tx.inventarioLote.update({
          where: { id: lote.id },
          data: {
            cantidadDisponible: {
              decrement: descontar,
            },
          },
        });

        // 3️⃣ Registrar salida ligada al lote
        const salida = await tx.salida.create({
          data: {
            productoId: Number(productoId),
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
        throw new Error("No hay suficiente inventario por lote");
      }

      // 4️⃣ Actualizar stock total del producto
      await tx.producto.update({
        where: { id: Number(productoId) },
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
        message: "Salida registrada con FIFO por lote",
        salidas: resultado,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Error POST salidas FIFO:", error);
    return NextResponse.json(
      { error: "Error al registrar salida por lote" },
      { status: 500 }
    );
  }
}

// ===========================================
// PUT — EDITAR METADATOS (NO TOCA STOCK)
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

    // ❗ NO SE MODIFICA INVENTARIO AQUÍ
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
