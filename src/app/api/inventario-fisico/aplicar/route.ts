import { NextRequest, NextResponse } from "next/server";
import {
  aplicarInventarioFisico,
  AplicarInventarioFisicoError,
  type ItemAjusteInventario,
} from "@/lib/inventario/aplicarInventarioFisico";

/* ==================================================
   TIPOS
================================================== */

interface AplicarInventarioSuccessResponse {
  success: true;
  entradas: number;
  salidas: number;
  sinCambios: number;
}

interface AplicarInventarioErrorResponse {
  success: false;
  message: string;
}

type AplicarInventarioResponse =
  | AplicarInventarioSuccessResponse
  | AplicarInventarioErrorResponse;

/* ==================================================
   VALIDACIÓN DE ENTRADA
================================================== */

function esItemValido(valor: unknown): valor is ItemAjusteInventario {
  if (typeof valor !== "object" || valor === null) return false;

  const posible = valor as Record<string, unknown>;

  return (
    typeof posible.productoId === "number" &&
    typeof posible.conteoFisico === "number"
  );
}

/* ==================================================
   ENDPOINT
================================================== */

export async function POST(
  request: NextRequest
): Promise<NextResponse<AplicarInventarioResponse>> {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "El cuerpo de la solicitud no es un JSON válido.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Se esperaba un arreglo con los productos revisados y su conteo físico.",
        },
        { status: 400 }
      );
    }

    if (!body.every(esItemValido)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Uno o más productos tienen un formato inválido (productoId y conteoFisico deben ser numéricos).",
        },
        { status: 400 }
      );
    }

    const resultado = await aplicarInventarioFisico(body);

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    if (error instanceof AplicarInventarioFisicoError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    console.error("[INVENTARIO_FISICO_APLICAR_POST]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error al aplicar los ajustes de inventario.",
      },
      { status: 500 }
    );
  }
}