import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const hoy = new Date();

    const compras = await prisma.compra.groupBy({
      by: ["proveedorId"],
      _sum: { costo: true },
      where: {
        fecha: {
          gte: startOfMonth(hoy),
          lte: endOfMonth(hoy),
        },
      },
    });

    const proveedores = await prisma.proveedor.findMany();

    const data = compras.map((c) => ({
      proveedor:
        proveedores.find((p) => p.id === c.proveedorId)?.nombre || "N/D",
      gasto: c._sum.costo || 0,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error proveedores" }, { status: 500 });
  }
}
