export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(req: NextRequest) {
  try {
    const movimientos = await prisma.movimiento.findMany({
      include: {
        producto: true,
      },
      orderBy: { fecha: "desc" },
    });

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const width = page.getWidth();
    const height = page.getHeight();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;

    page.drawText("Reporte de Movimientos", {
      x: 40,
      y,
      size: 22,
      font: fontBold,
      color: rgb(0.1, 0.8, 0.4),
    });

    y -= 40;

    for (const m of movimientos) {
      if (y < 80) {
        page = pdfDoc.addPage();
        y = page.getHeight() - 50;
      }

      page.drawText(`Producto: ${m.producto?.nombre ?? "-"}`, {
        x: 40,
        y,
        size: 12,
        font,
      });
      y -= 15;

      page.drawText(`Cantidad: ${m.cantidad}`, {
        x: 40,
        y,
        size: 12,
        font,
      });
      y -= 15;

      page.drawText(`Tipo: ${m.tipo}`, {
        x: 40,
        y,
        size: 12,
        font,
      });
      y -= 15;

      page.drawText(`Fecha: ${new Date(m.fecha).toLocaleString()}`, {
        x: 40,
        y,
        size: 12,
        font,
      });

      y -= 20;

      page.drawText("----------------------------------------", {
        x: 40,
        y,
        size: 12,
        font,
        color: rgb(0.7, 0.7, 0.7),
      });

      y -= 25;
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=movimientos.pdf",
      },
    });
  } catch (error) {
    console.error("❌ Error PDF movimientos:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
