import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

interface ProcesarSalidaParams {
  productoId: number;
  cantidad: number;
  rancho?: string | null;
  cultivo?: string | null;
  fecha?: Date;
}

export async function procesarSalida(
  tx: Tx,
  params: ProcesarSalidaParams
) {
  const {
    productoId,
    cantidad,
    rancho = null,
    cultivo = null,
    fecha = new Date(),
  } = params;

  if (!productoId || cantidad <= 0) {
    throw new Error("Producto y cantidad válidos son obligatorios.");
  }

  const producto = await tx.producto.findUnique({
    where: {
      id: productoId,
    },
  });

  if (!producto) {
    throw new Error("Producto no encontrado.");
  }

  // =====================================================
  // PRODUCTO SIN LOTES
  // =====================================================
  if (!producto.manejaLotes) {
    if (producto.stock < cantidad) {
      throw new Error(
        `Stock insuficiente para ${producto.nombre}`
      );
    }

    await tx.producto.update({
      where: {
        id: producto.id,
      },
      data: {
        stock: {
          decrement: cantidad,
        },
      },
    });

    const salida = await tx.salida.create({
      data: {
        productoId: producto.id,
        cantidad,
        rancho,
        cultivo,
        fecha,
      },
    });

    return {
      tipo: "DIRECTA",
      salida,
    };
  }

  // =====================================================
  // FIFO
  // =====================================================

  const lotes = await tx.inventarioLote.findMany({
    where: {
      productoId: producto.id,
      cantidadDisponible: {
        gt: 0,
      },
    },
    orderBy: [
      {
        fechaCaducidad: "asc",
      },
      {
        fechaEntrada: "asc",
      },
    ],
  });

  if (lotes.length === 0) {
    throw new Error(
      `No existen lotes disponibles para ${producto.nombre}`
    );
  }

  let restante = cantidad;

  const salidas = [];

  for (const lote of lotes) {
    if (restante <= 0) break;

    const descontar = Math.min(
      lote.cantidadDisponible,
      restante
    );

    await tx.inventarioLote.update({
      where: {
        id: lote.id,
      },
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
        rancho,
        cultivo,
        fecha,
      },
    });

    salidas.push(salida);

    restante -= descontar;
  }

  if (restante > 0) {
    throw new Error(
      `Stock insuficiente en los lotes para ${producto.nombre}`
    );
  }

  await tx.producto.update({
    where: {
      id: producto.id,
    },
    data: {
      stock: {
        decrement: cantidad,
      },
    },
  });

  return {
    tipo: "LOTE",
    salidas,
  };
}