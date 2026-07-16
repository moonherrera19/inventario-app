import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

interface ProcesarEntradaParams {
  productoId: number;
  cantidad: number;
  loteCodigo?: string | null;
  fechaCaducidad?: Date | null;
}

export async function procesarEntrada(
  tx: Tx,
  params: ProcesarEntradaParams
) {
  const {
    productoId,
    cantidad,
    loteCodigo,
    fechaCaducidad,
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

  // ==========================================
  // PRODUCTO SIN LOTES
  // ==========================================
  if (!producto.manejaLotes) {
    const entrada = await tx.entrada.create({
      data: {
        productoId,
        cantidad,
      },
    });

    await tx.producto.update({
      where: {
        id: productoId,
      },
      data: {
        stock: {
          increment: cantidad,
        },
      },
    });

    return {
      tipo: "DIRECTA",
      entrada,
    };
  }

  // ==========================================
  // PRODUCTO CON LOTES
  // ==========================================
  if (!loteCodigo) {
    throw new Error("Este producto requiere un lote.");
  }

  const inventarioLote = await tx.inventarioLote.create({
    data: {
      productoId,
      loteCodigo,
      fechaCaducidad: fechaCaducidad ?? null,
      cantidadDisponible: cantidad,
    },
  });

  const entrada = await tx.entrada.create({
    data: {
      productoId,
      cantidad,
    },
  });

  await tx.producto.update({
    where: {
      id: productoId,
    },
    data: {
      stock: {
        increment: cantidad,
      },
    },
  });

  return {
    tipo: "LOTE",
    entrada,
    inventarioLote,
  };
}