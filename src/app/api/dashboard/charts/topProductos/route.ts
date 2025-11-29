import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const consumos = await prisma.consumo.findMany({
      include: { producto: true },
    });

    const map = new Map();

    consumos.forEach((c) => {
      const previo = map.get(c.producto.nombre) || 0;
      map.set(c.producto.nombre, previo + c.cantidad);
    });

    const data = [...map.entries()]
      .map(([producto, total]) => ({ producto, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error top productos" }, { status: 500 });
  }
}
