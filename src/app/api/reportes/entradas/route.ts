export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearPDFBase } from "@/lib/pdf/basePDF";
import { rgb } from "pdf-lib";

export async function GET() {
  try {
    const entradas = await prisma.entrada.findMany({
      orderBy: { fecha: "desc" },
      include: {
        producto: true,
      },
    });

    // Base PDF
    const { pdfDoc, page, width, height, font } = await crearPDFBase();
    let currentPage = page;
    let y = height - 120;

    // TÍTULO
    currentPage.drawText("REPORTE DE ENTRADAS", {
      x: 20,
      y,
      size: 18,
      font,
      color: rgb(0, 0.5, 0.2),
    });

    y -= 35;

    // ENCABEZADOS
    currentPage.drawText("Fecha", { x: 20, y, size: 12, font });
    currentPage.drawText("Producto", { x: 140, y, size: 12, font });
    currentPage.drawText("Cantidad", { x: 350, y, size: 12, font });

    y -= 15;

    // Línea
    currentPage.drawLine({
      start: { x: 20, y },
      end: { x: width - 20, y },
      thickness: 1,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 20;

    // CONTENIDO
    for (const e of entradas) {
      // Crear nueva página cuando no cabe más contenido
      if (y < 80) {
        currentPage = pdfDoc.addPage([595.28, 841.89]);
        y = 800;

        currentPage.drawText("Fecha", { x: 20, y, size: 12, font });
        currentPage.drawText("Producto", { x: 140, y, size: 12, font });
        currentPage.drawText("Cantidad", { x: 350, y, size: 12, font });

        y -= 20;
      }

      currentPage.drawText(e.fecha.toISOString().slice(0, 10), {
        x: 20,
        y,
        size: 12,
        font,
      });

      currentPage.drawText(e.producto.nombre, {
        x: 140,
        y,
        size: 12,
        font,
      });

      currentPage.drawText(`${e.cantidad}`, {
        x: 350,
        y,
        size: 12,
        font,
      });

      y -= 18;
    }

    // GENERAR PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=entradas.pdf",
      },
    });

  } catch (error) {
    console.error("ERROR PDF ENTRADAS:", error);
    return NextResponse.json({ msg: "Error generando PDF" }, { status: 500 });
  }
}
