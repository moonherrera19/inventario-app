import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lotes = await prisma.lote.findMany({
      include: { consumos: true },
    });

    const data = lotes.map((l) => ({
      lote: l.nombre,
      total: l.consumos.reduce((acc, c) => acc + c.cantidad, 0),
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error lotes" }, { status: 500 });
  }
}
