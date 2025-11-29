import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const compras = await prisma.compra.findMany({
      orderBy: { id: "desc" },
      include: {
        producto: true,
        proveedor: true,
      },
    });

    return NextResponse.json(compras);
  } catch (error) {
    console.error("❌ Error GET compras:", error);
    return NextResponse.json(
      { error: "Error obteniendo compras" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productoId, proveedorId, cantidad, costo } = await req.json();

    if (!productoId || !proveedorId || !cantidad || !costo) {
      return NextResponse.json(
        { message: "Datos incompletos" },
        { status: 400 }
      );
    }

    const newCompra = await prisma.compra.create({
      data: {
        productoId: Number(productoId),
        proveedorId: Number(proveedorId),
        cantidad: Number(cantidad),
        costo: Number(costo),
      },
    });

    return NextResponse.json(newCompra);
  } catch (error) {
    console.error("❌ Error POST compras:", error);
    return NextResponse.json(
      { message: "Error registrando compra" },
      { status: 500 }
    );
  }
}
