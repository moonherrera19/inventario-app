import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      include: { productos: true },
    });

    const data = categorias.map((c) => ({
      categoria: c.nombre,
      total: c.productos.reduce((acc, p) => acc + p.stock, 0),
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error categorías" }, { status: 500 });
  }
}
