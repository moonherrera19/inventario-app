import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===============================
// GET → LISTAR APLICACIONES
// ===============================
export async function GET() {
  try {
    const data = await prisma.aplicacion.findMany({
      include: {
        receta: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener aplicaciones" },
      { status: 500 }
    );
  }
}

// ===============================
// POST → CREAR APLICACIÓN
// ===============================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nueva = await prisma.aplicacion.create({
      data: {
        ...body,
        fecha: new Date(body.fecha),
      },
    });

    return NextResponse.json(nueva);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al crear aplicación" },
      { status: 500 }
    );
  }
}