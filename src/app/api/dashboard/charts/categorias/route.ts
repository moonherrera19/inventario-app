import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      include: { productos: true }
    });

    const data = categorias.map(cat => ({
      nombre: cat.nombre,
      total: cat.productos.length
    }));

    return NextResponse.json(data);

  } catch (e) {
    console.error("ERROR categorias", e);
    return NextResponse.json([], { status: 500 });
  }
}
