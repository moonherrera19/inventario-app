import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const proveedores = await prisma.proveedor.findMany({
      include: { productos: true }
    });

    const data = proveedores.map(p => ({
      nombre: p.nombre,
      total: p.productos.length
    }));

    return NextResponse.json(data);

  } catch (e) {
    console.error("ERROR proveedores", e);
    return NextResponse.json([], { status: 500 });
  }
}
