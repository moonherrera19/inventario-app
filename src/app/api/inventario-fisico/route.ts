import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface ProductoInventarioFisico {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  manejaLotes: boolean;
}

export interface InventarioFisicoSuccessResponse {
  success: true;
  data: ProductoInventarioFisico[];
}

export interface InventarioFisicoErrorResponse {
  success: false;
  message: string;
}

export async function GET(): Promise<
  NextResponse<InventarioFisicoSuccessResponse | InventarioFisicoErrorResponse>
> {
  try {
    const productos = await prisma.producto.findMany({
      select: {
        id: true,
        nombre: true,
        unidad: true,
        stock: true,
        stockMinimo: true,
        manejaLotes: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });

    const data: ProductoInventarioFisico[] = productos.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      unidad: producto.unidad,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
      manejaLotes: producto.manejaLotes,
    }));

    return NextResponse.json<InventarioFisicoSuccessResponse>(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[INVENTARIO_FISICO_GET]", error);

    return NextResponse.json<InventarioFisicoErrorResponse>(
      {
        success: false,
        message: "Error al obtener los productos para el inventario físico.",
      },
      { status: 500 }
    );
  }
}