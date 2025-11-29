// app/api/reportes/recetas/pdf/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearPDFBase } from "@/lib/pdf/basePDF";
import { rgb } from "pdf-lib";

export async function GET() {
  try {
    const recetas = await prisma.receta.findMany({
      include: {
        ingredientes: {
          include: { producto: true },
        },
      },
    });

    const { pdfDoc, page, height, font } = await crearPDFBase();

    let y = height - 100;

    page.drawText("REPORTE DE RECETAS", {
      x: 20,
      y,
      size: 16,
      font,
      color: rgb(0, 0.5, 0.2),
    });

    y -= 30;

    recetas.forEach((receta) => {
      page.drawText(`• ${receta.nombre}`, {
        x: 20,
        y,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 20;

      receta.ingredientes.forEach((ing) => {
        page.drawText(
          `   - ${ing.producto.nombre}: ${ing.cantidad}`,
          {
            x: 40,
            y,
            size: 12,
            font,
            color: rgb(0.1, 0.1, 0.1),
          }
        );

        y -= 15;
      });

      y -= 15;

      // crear nueva página si se llena
      if (y < 100) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        y = 800;
      }
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte_recetas.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ PDF recetas:", error);
    return NextResponse.json({ error: "Error generando PDF" }, { status: 500 });
  }
}
