export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearPDFBase } from "@/lib/pdf/basePDF";
import { rgb } from "pdf-lib";

export async function GET() {
  try {
    const entradas = await prisma.entrada.findMany({
      include: {
        producto: true,
      },
      orderBy: { fecha: "desc" },
    });

    const { pdfDoc, page, width, height, font } = await crearPDFBase();
    let y = height - 120;

    page.drawText("REPORTE DE ENTRADAS", {
      x: 20,
      y,
      size: 18,
      font,
      color: rgb(0, 0.5, 0.2),
    });

    y -= 35;

    page.drawText("Fecha", { x: 20, y, size: 12, font });
    page.drawText("Producto", { x: 140, y, size: 12, font });
    page.drawText("Cantidad", { x: 350, y, size: 12, font });

    y -= 15;

    page.drawLine({
      start: { x: 20, y },
      end: { x: width - 20, y },
      thickness: 1,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 20;

    entradas.forEach((e) => {
      page.drawText(e.fecha.toISOString().slice(0, 10), {
        x: 20,
        y,
        size: 12,
        font,
      });

      page.drawText(e.producto.nombre, {
        x: 140,
        y,
        size: 12,
        font,
      });

      page.drawText(`${e.cantidad}`, {
        x: 350,
        y,
        size: 12,
        font,
      });

      y -= 18;

      if (y < 80) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        y = 800;
      }
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=entradas.pdf",
      },
    });
  } catch (error) {
    console.error("ERROR PDF ENTRADAS:", error);
    return NextResponse.json({ msg: "Error" }, { status: 500 });
  }
}
