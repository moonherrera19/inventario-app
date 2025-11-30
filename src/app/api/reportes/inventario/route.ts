export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    });

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const width = page.getWidth();
    const height = page.getHeight();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - 50;

    page.drawText("Reporte de Inventario", {
      x: 40, y, size: 22, font, color: rgb(0.1, 0.8, 0.8)
    });
    y -= 40;

    for (const p of productos) {
      if (y < 80) {
        page = pdfDoc.addPage();
        y = page.getHeight() - 50;
      }

      page.drawText(`${p.nombre} — Stock: ${p.stock}`, {
        x: 40, y, size: 12, font
      });

      y -= 20;
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=inventario.pdf"
      }
    });

  } catch (e) {
    console.error("Error PDF Inventario:", e);
    return NextResponse.json({ msg: "Error generando PDF" }, { status: 500 });
  }
}
