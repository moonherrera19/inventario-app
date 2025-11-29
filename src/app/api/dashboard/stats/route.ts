import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany();
    const stockBajo = productos.filter(p => p.stock <= p.stockMinimo).length;

    const valorInventario = productos.reduce((acc, p) => {
      if (p.precioUnitario) acc += p.stock * p.precioUnitario;
      return acc;
    }, 0);

    const comprasMes = await prisma.compra.aggregate({
      _sum: { costo: true },
      where: { fecha: { gte: startOfMonth(new Date()), lte: endOfMonth(new Date()) } },
    });

    const entradasSemana = await prisma.entrada.groupBy({
      by: ["fecha"],
      _sum: { cantidad: true },
    });

    const salidasSemana = await prisma.salida.groupBy({
      by: ["fecha"],
      _sum: { cantidad: true },
    });

    return NextResponse.json({
      totalProductos: productos.length,
      stockBajo,
      valorInventario,
      gastoMes: comprasMes._sum.costo || 0,
      entradasSemana,
      salidasSemana,
    });
  } catch (e) {
    return NextResponse.json({ error: "Error dashboard" }, { status: 500 });
  }
}
