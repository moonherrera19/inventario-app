import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { recetaId, unidades } = await req.json();

  const receta = await prisma.receta.findUnique({
    where: { id: recetaId },
    include: {
      ingredientes: true,
    },
  });

  if (!receta)
    return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });

  // Validar stock
  for (const ing of receta.ingredientes) {
    const producto = await prisma.producto.findUnique({
      where: { id: ing.productoId },
    });

    const requerido = ing.cantidad * unidades;

    if (producto!.stock < requerido) {
      return NextResponse.json(
        {
          error: `Stock insuficiente para ${producto!.nombre}. Se requieren ${requerido}.`,
        },
        { status: 400 }
      );
    }
  }

  // Descontar stock
  for (const ing of receta.ingredientes) {
    const requerido = ing.cantidad * unidades;

    await prisma.producto.update({
      where: { id: ing.productoId },
      data: {
        stock: { decrement: requerido },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
