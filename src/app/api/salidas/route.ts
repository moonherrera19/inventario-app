import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================================
// GET - LISTAR SALIDAS
// ======================================================
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
    return NextResponse.json({ error: "Error al obtener salidas" }, { status: 500 });
  }
}

// ======================================================
// Helper - crea una salida nueva (usado por POST)
// ======================================================
async function procesarItem(
  tx: any,
  productoId: number,
  cantidad: number,
  rancho: string | null,
  cultivo: string | null,
  fecha: Date
) {
  const producto = await tx.producto.findUnique({ where: { id: productoId } });

  if (!producto) throw new Error(`Producto ${productoId} no encontrado`);

  if (!producto.manejaLotes) {
    if (producto.stock < cantidad) throw new Error(`Stock insuficiente para ${producto.nombre}`);

    await tx.producto.update({
      where: { id: producto.id },
      data: { stock: { decrement: cantidad } },
    });

    await tx.salida.create({
      data: {
        productoId: producto.id,
        cantidad,
        rancho,
        cultivo,
        fecha,
      },
    });

    return { tipo: "DIRECTA", producto: producto.nombre };
  }

  // FIFO por lotes
  const lotes = await tx.inventarioLote.findMany({
    where: { productoId: producto.id, cantidadDisponible: { gt: 0 } },
    orderBy: [{ fechaCaducidad: "asc" }, { fechaEntrada: "asc" }],
  });

  if (!lotes.length) throw new Error(`Sin lotes disponibles para ${producto.nombre}`);

  let restante = cantidad;

  for (const lote of lotes) {
    if (restante <= 0) break;
    const descontar = Math.min(lote.cantidadDisponible, restante);

    await tx.inventarioLote.update({
      where: { id: lote.id },
      data: { cantidadDisponible: { decrement: descontar } },
    });

    await tx.salida.create({
      data: {
        productoId: producto.id,
        inventarioLoteId: lote.id,
        cantidad: descontar,
        rancho,
        cultivo,
        fecha,
      },
    });

    restante -= descontar;
  }

  if (restante > 0) throw new Error(`Stock insuficiente en lotes para ${producto.nombre}`);

  await tx.producto.update({
    where: { id: producto.id },
    data: { stock: { decrement: cantidad } },
  });

  return { tipo: "LOTE", producto: producto.nombre };
}

// ======================================================
// POST - REGISTRAR SALIDA(S)
// ======================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rancho, cultivo, fecha, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Debes agregar al menos un producto" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.productoId || !item.cantidad || Number(item.cantidad) <= 0) {
        return NextResponse.json(
          { error: "Cada producto debe tener cantidad mayor a 0" },
          { status: 400 }
        );
      }
    }

    const fechaFinal = fecha ? new Date(fecha) : new Date();

    const resultados = await prisma.$transaction(async (tx) => {
      const res = [];
      for (const item of items) {
        const r = await procesarItem(
          tx,
          Number(item.productoId),
          Number(item.cantidad),
          rancho || null,
          cultivo || null,
          fechaFinal
        );
        res.push(r);
      }
      return res;
    });

    return NextResponse.json({ ok: true, resultados }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error POST salidas:", error);
    return NextResponse.json({ error: error.message || "Error al registrar salida" }, { status: 500 });
  }
}

// ======================================================
// PUT - EDITAR SALIDA (CORREGIDO)
//
// PROBLEMA ORIGINAL:
// Solo actualizaba Salida.cantidad, sin tocar Producto.stock
// ni InventarioLote.cantidadDisponible. Esto desincronizaba
// permanentemente el stock cacheado del historial real.
//
// CORRECCIÓN:
// - Se calcula el delta = nuevaCantidad - cantidadAnterior.
// - Todo ocurre dentro de una $transaction (atómico).
// - Caso DIRECTA (sin lote): se ajusta Producto.stock con el delta.
// - Caso LOTE: se ajusta InventarioLote.cantidadDisponible del
//   MISMO lote original (no se re-ejecuta FIFO), y también se
//   ajusta Producto.stock para mantener stock == SUM(lotes).
// - Se valida que ningún ajuste deje cantidades negativas.
// ======================================================
export async function PUT(req: Request) {
  try {
    const { id, cantidad, rancho, cultivo } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 });
    }

    const nuevaCantidad = Number(cantidad);

    if (!nuevaCantidad || nuevaCantidad <= 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser mayor a 0" },
        { status: 400 }
      );
    }

    const salidaActualizada = await prisma.$transaction(async (tx) => {
      // 1️⃣ Traer la salida existente con su lote (si tiene)
      const salidaExistente = await tx.salida.findUnique({
        where: { id: Number(id) },
        include: { inventarioLote: true },
      });

      if (!salidaExistente) {
        throw new Error("Salida no encontrada");
      }

      const cantidadAnterior = salidaExistente.cantidad;
      const delta = nuevaCantidad - cantidadAnterior; // + = se está sacando más, - = se está devolviendo

      // 2️⃣ Caso LOTE: la salida está ligada a un InventarioLote específico
      if (salidaExistente.inventarioLoteId) {
        const lote = await tx.inventarioLote.findUnique({
          where: { id: salidaExistente.inventarioLoteId },
        });

        if (!lote) {
          throw new Error("Lote asociado a la salida no encontrado");
        }

        const nuevaCantidadLote = lote.cantidadDisponible - delta;

        if (nuevaCantidadLote < 0) {
          throw new Error(
            `Stock insuficiente en el lote "${lote.loteCodigo}" para aplicar este cambio`
          );
        }

        // Ajustar el lote específico (no se redistribuye por FIFO)
        await tx.inventarioLote.update({
          where: { id: lote.id },
          data: { cantidadDisponible: { decrement: delta } },
        });

        // Mantener sincronizado Producto.stock == SUM(lotes)
        const producto = await tx.producto.findUnique({
          where: { id: salidaExistente.productoId },
        });

        if (!producto) throw new Error("Producto no encontrado");

        if (producto.stock - delta < 0) {
          throw new Error(
            `Stock insuficiente en "${producto.nombre}" para aplicar este cambio`
          );
        }

        await tx.producto.update({
          where: { id: producto.id },
          data: { stock: { decrement: delta } },
        });

      } else {
        // 3️⃣ Caso DIRECTA: sin lote, se ajusta solo Producto.stock
        const producto = await tx.producto.findUnique({
          where: { id: salidaExistente.productoId },
        });

        if (!producto) throw new Error("Producto no encontrado");

        if (producto.stock - delta < 0) {
          throw new Error(
            `Stock insuficiente en "${producto.nombre}" para aplicar este cambio`
          );
        }

        await tx.producto.update({
          where: { id: producto.id },
          data: { stock: { decrement: delta } },
        });
      }

      // 4️⃣ Finalmente, actualizar el registro de la salida
      return tx.salida.update({
        where: { id: Number(id) },
        data: {
          cantidad: nuevaCantidad,
          rancho: rancho || null,
          cultivo: cultivo || null,
        },
      });
    });

    return NextResponse.json(salidaActualizada);
  } catch (error: any) {
    console.error("❌ Error PUT salidas:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar salida" },
      { status: 500 }
    );
  }
}