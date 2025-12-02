import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { stock: "desc" },
      take: 5,
    });

    return NextResponse.json(productos);

  } catch (e) {
    console.error("ERROR topProductos", e);
    return NextResponse.json([], { status: 500 });
  }
}
