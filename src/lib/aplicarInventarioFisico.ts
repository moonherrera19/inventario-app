import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * ⚠️ ADAPTA ESTOS DOS IMPORTS A TUS SERVICIOS REALES DE ENTRADAS Y SALIDAS.
 *
 * No tengo acceso a tu código actual de `Entradas` / `Salidas` / FIFO, así
 * que asumo que expones funciones capaces de recibir el cliente de
 * transacción (`tx`) para que todo corra dentro del MISMO
 * `prisma.$transaction` y así garantizar el rollback atómico.
 *
 * Si tus funciones ya existen con otra firma (por ejemplo reciben un
 * `motivoId`, o un `usuarioId`, o el nombre es `registrarEntrada`), solo
 * ajusta la llamada dentro de `aplicarInventarioFisico` más abajo. La
 * lógica de diferencia/transacción/validación NO depende de esa firma.
 */
import { crearEntrada } from "@/lib/inventario/entradas";
import { crearSalida } from "@/lib/inventario/salidas";

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
        select: { id: true, nombre: true, stock: true },
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
        // ⚠️ Ajusta esta llamada a la firma real de tu servicio de Entradas.
        await crearEntrada(tx, {
          productoId: producto.id,
          cantidad: diferencia,
          motivo: MOTIVO_AJUSTE,
          referencia: REFERENCIA_AJUSTE,
        });
        entradas++;
      } else {
        // ⚠️ Ajusta esta llamada a la firma real de tu servicio de Salidas
        // (debe seguir usando FIFO tal cual funciona hoy).
        await crearSalida(tx, {
          productoId: producto.id,
          cantidad: Math.abs(diferencia),
          motivo: MOTIVO_AJUSTE,
          referencia: REFERENCIA_AJUSTE,
        });
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