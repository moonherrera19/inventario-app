export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET() {
  try {
    const consumos = await prisma.consumo.findMany({
      orderBy: { fecha: "desc" },
      include: {
        lote: true,
        producto: true,
      },
    });

    // Crear PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const width = page.getWidth();
    const height = page.getHeight();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50; // posicion inicial

    // TÍTULO
    page.drawText("Reporte de Consumos", {
      x: 50,
      y,
      size: 22,
      font: fontBold,
      color: rgb(0.05, 0.9, 0.48), // verde
    });

    y -= 30;

    // Fecha
    page.drawText(`Generado: ${new Date().toLocaleString()}`, {
      x: 50,
      y,
      size: 12,
      font,
      color: rgb(1, 1, 1),
    });

    y -= 40;

    let total = 0;

    // RECORRER CONSUMOS
    for (const c of consumos) {
      if (y < 80) {
        // Crear nueva página automática
        const newPage = pdfDoc.addPage();
        y = newPage.getHeight() - 50;
      }

      page.drawText(`Lote: ${c.lote?.nombre}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(1, 1, 1),
      });
      y -= 15;

      page.drawText(`Producto: ${c.producto?.nombre}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(1, 1, 1),
      });
      y -= 15;

      page.drawText(`Cantidad: ${c.cantidad}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(1, 1, 1),
      });
      y -= 15;

      page.drawText(`Fecha: ${new Date(c.fecha).toLocaleString()}`, {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(1, 1, 1),
      });
      y -= 20;

      // separador
      page.drawText("-------------------------------------------", {
        x: 50,
        y,
        size: 12,
        font,
        color: rgb(0.8, 0.8, 0.8),
      });

      y -= 25;

      total += c.cantidad;
    }

    // TOTAL
    if (y < 60) {
      pdfDoc.addPage();
      y = height - 50;
    }

    page.drawText(`Total consumido: ${total}`, {
      x: 50,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.05, 0.9, 0.48),
    });

    // Exportar PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=consumos.pdf",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
