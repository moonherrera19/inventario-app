export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(req: NextRequest) {
  try {
    const recetas = await prisma.receta.findMany({
      include: {
        ingredientes: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const width = page.getWidth();
    const height = page.getHeight();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;

    page.drawText("Reporte de Recetas", {
      x: 40,
      y,
      size: 22,
      font: bold,
      color: rgb(0.2, 0.8, 0.2),
    });

    y -= 40;

    for (const r of recetas) {
      if (y < 120) {
        page = pdfDoc.addPage();
        y = page.getHeight() - 50;
      }

      page.drawText(`Receta: ${r.nombre}`, {
        x: 40,
        y,
        size: 14,
        font: bold,
        color: rgb(1, 1, 1),
      });

      y -= 20;

      if (r.ingredientes.length === 0) {
        page.drawText("Sin ingredientes registrados", {
          x: 60,
          y,
          size: 12,
          font,
          color: rgb(0.7, 0.7, 0.7),
        });
        y -= 20;
        continue;
      }

      for (const ing of r.ingredientes) {
        if (y < 80) {
          page = pdfDoc.addPage();
          y = page.getHeight() - 50;
        }

        page.drawText(
          `• ${ing.producto?.nombre ?? "-"} — ${ing.cantidad} ${ing.producto?.unidad ?? ""}`,
          {
            x: 60,
            y,
            size: 12,
            font,
          }
        );

        y -= 15;
      }

      y -= 20;

      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 1,
        color: rgb(0.5, 0.5, 0.5),
      });

      y -= 20;
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=recetas.pdf",
      },
    });
  } catch (error) {
    console.error("❌ Error PDF recetas:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
