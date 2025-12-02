export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearPDFBase } from "@/lib/pdf/basePDF";
import { rgb } from "pdf-lib";

export async function GET() {
  try {
    const salidas = await prisma.salida.findMany({
      orderBy: { fecha: "desc" },
      include: { producto: true },
    });

    // BASE PDF (encabezado general)
    const { pdfDoc, page, width, height, font } = await crearPDFBase();
    let currentPage = page;
    let y = height - 130;

    // ============================
    // TÍTULO
    // ============================
    currentPage.drawText("REPORTE DE SALIDAS", {
      x: 20,
      y,
      size: 18,
      font,
      color: rgb(0, 0.45, 0.2),
    });

    y -= 35;

    // ============================
    // ENCABEZADOS
    // ============================
    currentPage.drawText("Fecha", { x: 20, y, size: 12, font });
    currentPage.drawText("Producto", { x: 140, y, size: 12, font });
    currentPage.drawText("Unidad", { x: 330, y, size: 12, font });
    currentPage.drawText("Salida", { x: 430, y, size: 12, font });

    y -= 15;

    currentPage.drawLine({
      start: { x: 20, y },
      end: { x: width - 20, y },
      thickness: 1,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 20;

    // ============================
    // CONTENIDO
    // ============================
    for (const s of salidas) {
      // Nueva página si no cabe
      if (y < 70) {
        currentPage = pdfDoc.addPage([595.28, 841.89]);
        y = 800;

        currentPage.drawText("Fecha", { x: 20, y, size: 12, font });
        currentPage.drawText("Producto", { x: 140, y, size: 12, font });
        currentPage.drawText("Unidad", { x: 330, y, size: 12, font });
        currentPage.drawText("Salida", { x: 430, y, size: 12, font });

        y -= 20;
      }

      // FILA
      currentPage.drawText(s.fecha.toISOString().slice(0, 10), {
        x: 20,
        y,
        size: 12,
        font,
      });

      currentPage.drawText(s.producto.nombre, {
        x: 140,
        y,
        size: 12,
        font,
      });

      currentPage.drawText(s.producto.unidad || "-", {
        x: 330,
        y,
        size: 12,
        font,
      });

      currentPage.drawText(String(s.cantidad), {
        x: 430,
        y,
        size: 12,
        font,
      });

      y -= 18;
    }

    // FINAL
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=reporte_salidas.pdf",
      },
    });

  } catch (error) {
    console.error("❌ ERROR PDF SALIDAS:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
