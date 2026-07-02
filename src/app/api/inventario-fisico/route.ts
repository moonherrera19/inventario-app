import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: {
        nombre: "asc",
      },
      select: {
        id: true,
        nombre: true,
        unidad: true,
        stock: true,
        stockMinimo: true,
        manejaLotes: true,
      },
    });

    return NextResponse.json(productos);

  } catch (error) {
    console.error("Error obteniendo inventario físico:", error);

    return NextResponse.json(
      {
        error: "No fue posible obtener los productos.",
      },
      {
        status: 500,
      }
    );
  }
}