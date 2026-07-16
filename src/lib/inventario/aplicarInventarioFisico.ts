import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { procesarEntrada } from "@/lib/inventario/procesarEntrada";
import { procesarSalida } from "@/lib/inventario/procesarSalida";

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

// Tolerancia para comparar floats (evita falsos "Entrada"/"Salida" por
// errores de redondeo de punto flotante en el conteo capturado).
const TOLERANCIA_DIFERENCIA = 0.0001;

// Texto usado para identificar en reportes las Salidas generadas por este
// módulo (Salida.cultivo es un campo libre, no crea un motivo nuevo en BD).
const CULTIVO_AJUSTE = "Ajuste de Inventario Físico";

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
   HELPERS
================================================== */

// Código de lote determinístico para Entradas de ajuste en productos que
// manejan lotes (procesarEntrada exige loteCodigo cuando manejaLotes=true).
// Cambia este formato si tu operación ya tiene otra convención de códigos.
function generarLoteCodigoAjuste(productoId: number): string {
  const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `AJUSTE-${productoId}-${fecha}`;
}

/* ==================================================
   SERVICIO PRINCIPAL
================================================== */

/**
 * Recorre los productos revisados, compara Conteo vs Stock del sistema y
 * crea Entradas o Salidas llamando al motor real ya existente
 * (procesarEntrada / procesarSalida). Este archivo NUNCA escribe en
 * `Producto.stock` ni en `InventarioLote` directamente ni crea registros
 * de Entrada/Salida a mano: toda esa lógica (incluido el consumo FIFO de
 * lotes) la sigue haciendo exactamente el mismo código que usan los
 * endpoints manuales de Entradas y Salidas.
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
        select: {
          id: true,
          nombre: true,
          stock: true,
          manejaLotes: true,
        },
      });

      if (!producto) {
        throw new AplicarInventarioFisicoError(
          `El producto ${item.productoId} no existe.`
        );
      }

      const diferencia = item.conteoFisico - producto.stock;

      if (Math.abs(diferencia) < TOLERANCIA_DIFERENCIA) {
        sinCambios++;
        continue;
      }

      if (diferencia > 0) {
        await procesarEntrada(tx, {
          productoId: producto.id,
          cantidad: diferencia,
          loteCodigo: producto.manejaLotes
            ? generarLoteCodigoAjuste(producto.id)
            : undefined,
        });
        entradas++;
      } else {
        await procesarSalida(tx, {
          productoId: producto.id,
          cantidad: Math.abs(diferencia),
          cultivo: CULTIVO_AJUSTE,
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