import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalProductos = await prisma.producto.count();

    const stockBajo = await prisma.producto.count({
      where: { stock: { lt: prisma.producto.fields.stockMinimo } }
    });

    const productos = await prisma.producto.findMany();
    const valorInventario = productos.reduce(
      (acc, p) => acc + (p.precioUnitario || 0) * p.stock,
      0
    );

    const comprasMes = await prisma.compra.aggregate({
      _sum: { costo: true },
    });

    return NextResponse.json({
      totalProductos,
      stockBajo,
      valorInventario,
      comprasMes: comprasMes._sum.costo || 0
    });

  } catch (e) {
    console.error("ERROR /stats", e);
    return NextResponse.json({ error: "Error en stats" }, { status: 500 });
  }
}
