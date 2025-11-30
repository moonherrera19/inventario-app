export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Buffer } from "buffer"; // 👈 IMPORTANTE

export async function GET(req: NextRequest) {
  try {
    const salidas = await prisma.salida.findMany({
      include: { producto: true },
      orderBy: { fecha: "desc" },
    });

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const width = page.getWidth();
    const height = page.getHeight();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;

    // TÍTULO
    page.drawText("Reporte de Salidas", {
      x: 40,
      y,
      size: 22,
      font: bold,
      color: rgb(0.2, 0.8, 0.2),
    });

    y -= 40;

    // SI NO HAY SALIDAS
    if (salidas.length === 0) {
      page.drawText("No hay salidas registradas.", {
        x: 40,
        y,
        size: 14,
        font,
        color: rgb(0.7, 0.7, 0.7),
      });

      const pdfBytesEmpty = await pdfDoc.save();

      return new NextResponse(Buffer.from(pdfBytesEmpty), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=salidas.pdf",
        },
      });
    }

    // RECORRER CADA SALIDA
    for (const s of salidas) {
      if (y < 100) {
        page = pdfDoc.addPage();
        y = page.getHeight() - 50;
      }

      page.drawText(`Producto: ${s.producto?.nombre ?? "-"}`, {
        x: 40,
        y,
        size: 14,
        font: bold,
      });

      y -= 18;

      page.drawText(`Cantidad: ${s.cantidad}`, {
        x: 40,
        y,
        size: 12,
        font,
      });

      y -= 15;

      page.drawText(`Fecha: ${new Date(s.fecha).toLocaleString()}`, {
        x: 40,
        y,
        size: 12,
        font,
      });

      y -= 20;

      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 1,
        color: rgb(0.5, 0.5, 0.5),
      });

      y -= 30;
    }

    // GENERAR PDF FINAL
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=salidas.pdf",
      },
    });

  } catch (error) {
    console.error("❌ Error PDF salidas:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
