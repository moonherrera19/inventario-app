export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Buffer } from "buffer";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { nombre: "asc" },
    });

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const width = page.getWidth();
    let y = page.getHeight() - 40;

    // ===========================================
    // ENCABEZADO
    // ===========================================
    page.drawText("SISTEMA DE INVENTARIO AGRÍCOLA", {
      x: 40,
      y,
      size: 18,
      font: bold,
      color: rgb(0, 0.5, 0.25),
    });

    y -= 10;

    page.drawLine({
      start: { x: 40, y },
      end: { x: width - 40, y },
      thickness: 1.5,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 35;

    // TÍTULO DEL REPORTE
    page.drawText("REPORTE DE INVENTARIO GENERAL", {
      x: 40,
      y,
      size: 16,
      font: bold,
      color: rgb(0, 0.5, 0.25),
    });

    y -= 25;

    // FECHA
    page.drawText(`Fecha de generación: ${new Date().toLocaleString()}`, {
      x: 40,
      y,
      size: 11,
      font,
    });

    y -= 30;

    // ===========================================
    // ENCABEZADOS DE TABLA
    // ===========================================
    page.drawText("Producto", { x: 40, y, size: 12, font: bold });
    page.drawText("Unidad", { x: 260, y, size: 12, font: bold });
    page.drawText("Stock", { x: 350, y, size: 12, font: bold });
    page.drawText("Mínimo", { x: 430, y, size: 12, font: bold });

    y -= 15;

    // Línea divisoria
    page.drawLine({
      start: { x: 40, y },
      end: { x: width - 40, y },
      thickness: 1,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 20;

    // ===========================================
    // CONTENIDO DE PRODUCTOS
    // ===========================================
    for (const p of productos) {
      if (y < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = page.getHeight() - 50;

        // Reimprimir encabezados en nueva página
        page.drawText("Producto", { x: 40, y, size: 12, font: bold });
        page.drawText("Unidad", { x: 260, y, size: 12, font: bold });
        page.drawText("Stock", { x: 350, y, size: 12, font: bold });
        page.drawText("Mínimo", { x: 430, y, size: 12, font: bold });

        y -= 20;
      }

      page.drawText(p.nombre, { x: 40, y, size: 11, font });
      page.drawText(p.unidad ?? "-", { x: 260, y, size: 11, font });
      page.drawText(String(p.stock), { x: 350, y, size: 11, font });
      page.drawText(String(p.stockMinimo ?? 0), { x: 430, y, size: 11, font });

      y -= 18;
    }

    // ===========================================
    // EXPORTAR PDF
    // ===========================================
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=inventario_general.pdf",
      },
    });

  } catch (error) {
    console.error("❌ Error PDF INVENTARIO:", error);
    return NextResponse.json(
      { msg: "Error generando PDF" },
      { status: 500 }
    );
  }
}
