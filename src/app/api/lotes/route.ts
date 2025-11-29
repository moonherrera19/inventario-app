import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, cultivo, areaHa } = body;

    // Validaciones
    if (!nombre || nombre.trim().length === 0)
      return NextResponse.json(
        { message: "El nombre del lote es obligatorio." },
        { status: 400 }
      );

    const areaNum = areaHa !== null && areaHa !== undefined ? Number(areaHa) : 0;

    if (isNaN(areaNum) || areaNum < 0)
      return NextResponse.json(
        { message: "El área (hectáreas) debe ser un número mayor o igual a 0." },
        { status: 400 }
      );

    const lote = await prisma.lote.create({
      data: {
        nombre,
        cultivo: cultivo || "",
        areaHa: areaNum,
      },
    });

    return NextResponse.json(lote);
  } catch (error) {
    console.error("❌ Error POST Lotes:", error);
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

// Obtener todos los lotes
export async function GET() {
  try {
    const lotes = await prisma.lote.findMany({
      orderBy: { id: "desc" }
    });

    return NextResponse.json(lotes);
  } catch (error) {
    console.error("❌ Error GET Lotes:", error);
    return NextResponse.json(
      { message: "Error al obtener lotes." },
      { status: 500 }
    );
  }
}
