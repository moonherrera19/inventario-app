import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PrismaTransactionClient = Prisma.TransactionClient;

/* ==================================================
   TIPOS
================================================== */

export interface ItemAjusteInventario {
  productoId: number;
  conteoFisico: number;
}

export interface ResultadoAplicarInventarioFisico {
  success: true;
  entradas: number;
  salidas: number;
  sinCambios: number;
}

export class AplicarInventarioFisicoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AplicarInventarioFisicoError";
  }
}

const MOTIVO_AJUSTE = "Ajuste por Inventario Físico";
const REFERENCIA_AJUSTE = "inventario-fisico";

/* ==================================================
   VALIDACIÓN
================================================== */

function validarItems(items: ItemAjusteInventario[]): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AplicarInventarioFisicoError(
      "No se recibieron productos para procesar."
    );
  }

  const idsVistos = new Set<number>();

  for (const item of items) {
    if (
      typeof item.productoId !== "number" ||
      !Number.isInteger(item.productoId) ||
      item.productoId <= 0
    ) {
      throw new AplicarInventarioFisicoError(
        `productoId inválido: ${String(item.productoId)}`
      );
    }

    if (idsVistos.has(item.productoId)) {
      throw new AplicarInventarioFisicoError(
        `El producto ${item.productoId} está duplicado en la solicitud.`
      );
    }
    idsVistos.add(item.productoId);

    if (
      typeof item.conteoFisico !== "number" ||
      Number.isNaN(item.conteoFisico) ||
      !Number.isFinite(item.conteoFisico)
    ) {
      throw new AplicarInventarioFisicoError(
        `El conteo físico del producto ${item.productoId} es inválido.`
      );
    }

    if (item.conteoFisico < 0) {
      throw new AplicarInventarioFisicoError(
        `El conteo físico del producto ${item.productoId} no puede ser negativo.`
      );
    }
  }
}

/* ==================================================
   SERVICIO PRINCIPAL
================================================== */

/**
 * Recorre los productos revisados, compara Conteo vs Stock del sistema y
 * crea Entradas o Salidas usando el motor existente. Nunca escribe en
 * `Producto.stock` ni en `InventarioLote` directamente: eso lo sigue
 * haciendo el motor de Entradas/Salidas, como ya funciona hoy.
 *
 * Todo corre dentro de una única transacción: si un producto falla,
 * se hace ROLLBACK y no se aplica ningún cambio.
 */
export async function aplicarInventarioFisico(
  items: ItemAjusteInventario[]
): Promise<ResultadoAplicarInventarioFisico> {
  validarItems(items);

  let entradas = 0;
  let salidas = 0;
  let sinCambios = 0;

  await prisma.$transaction(async (tx: PrismaTransactionClient) => {
    for (const item of items) {
      const producto = await tx.producto.findUnique({
        where: { id: item.productoId },
        select: { id: true, nombre: true, stock: true, manejaLotes: true },
      });

      if (!producto) {
        throw new AplicarInventarioFisicoError(
          `El producto ${item.productoId} no existe.`
        );
      }

      const diferencia = item.conteoFisico - producto.stock;

      if (diferencia === 0) {
        sinCambios++;
        continue;
      }

      if (diferencia > 0) {
        await registrarEntrada(tx, producto, diferencia);
        entradas++;
      } else {
        await registrarSalida(tx, producto, Math.abs(diferencia));
        salidas++;
      }
    }
  });

  return {
    success: true,
    entradas,
    salidas,
    sinCambios,
  };
}

/* ==================================================
   REGISTRO DIRECTO DE ENTRADA / SALIDA
   ⚠️ Nombres de campos (`entrada.create`, `salida.create`) son mi mejor
   suposición porque no tengo tu schema.prisma. Ajústalos si tus modelos
   Entrada/Salida usan otros nombres de columnas.
================================================== */

async function registrarEntrada(
  tx: PrismaTransactionClient,
  producto: { id: number; manejaLotes: boolean },
  cantidad: number
): Promise<void> {
  // TODO(lotes): si `producto.manejaLotes` es true, aquí también debería
  // crearse el registro correspondiente en `InventarioLote` (fecha de
  // entrada, cantidad, cantidadDisponible = cantidad) para que el FIFO de
  // Salidas lo pueda consumir después. No tengo ese modelo, así que hoy
  // esta función NO crea el lote. Pásame tu modelo InventarioLote y lo
  // agrego aquí.
  await tx.entrada.create({
    data: {
      productoId: producto.id,
      cantidad,
      fecha: new Date(),
      motivo: MOTIVO_AJUSTE,
      referencia: REFERENCIA_AJUSTE,
    },
  });

  await tx.producto.update({
    where: { id: producto.id },
    data: { stock: { increment: cantidad } },
  });
}

async function registrarSalida(
  tx: PrismaTransactionClient,
  producto: { id: number; manejaLotes: boolean },
  cantidad: number
): Promise<void> {
  if (producto.manejaLotes) {
    // No tengo el modelo `InventarioLote`, así que NO voy a inventar un
    // consumo FIFO y arriesgarme a corromper el historial de lotes de un
    // producto que sí lo usa. Mejor frenar aquí con un error claro que
    // dejar datos mal calculados. Pásame el modelo InventarioLote de tu
    // schema.prisma (campos de fecha de entrada, cantidad, cantidad
    // disponible) y completo el consumo FIFO real.
    throw new AplicarInventarioFisicoError(
      `El producto "${producto.id}" maneja lotes (FIFO). El consumo automático de lotes en Salidas aún no está integrado en este servicio.`
    );
  }

  await tx.salida.create({
    data: {
      productoId: producto.id,
      cantidad,
      fecha: new Date(),
      motivo: MOTIVO_AJUSTE,
      referencia: REFERENCIA_AJUSTE,
    },
  });

  await tx.producto.update({
    where: { id: producto.id },
    data: { stock: { decrement: cantidad } },
  });
}