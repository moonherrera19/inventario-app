// app/api/reportes/lote/pdf/[id]/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearPDFBase } from "@/lib/pdf/basePDF";
import { rgb } from "pdf-lib";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const loteId = Number(id);

    if (!loteId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const lote = await prisma.lote.findUnique({
      where: { id: loteId },
      include: {
        consumos: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!lote) {
      return NextResponse.json(
        { error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    const { pdfDoc, page, width, height, font } = await crearPDFBase();
    let currentPage = page;
    let y = height - 120;

    currentPage.drawText(`REPORTE DE LOTE`, {
      x: 20,
      y,
      size: 18,
      font,
      color: rgb(0, 0.5, 0.2),
    });

    y -= 30;

    currentPage.drawText(`Nombre del lote: ${lote.nombre}`, {
      x: 20,
      y,
      size: 14,
      font,
    });

    y -= 20;

    currentPage.drawText(`Cultivo: ${lote.cultivo || "No especificado"}`, {
      x: 20,
      y,
      size: 14,
      font,
    });

    y -= 20;

    currentPage.drawText(`Área: ${lote.areaHa ?? 0} ha`, {
      x: 20,
      y,
      size: 14,
      font,
    });

    y -= 40;

    currentPage.drawText(`CONSUMOS AGRÍCOLAS`, {
      x: 20,
      y,
      size: 16,
      font,
      color: rgb(0.1, 0.4, 0.2),
    });

    y -= 25;

    if (lote.consumos.length === 0) {
      currentPage.drawText("Este lote no tiene consumos registrados.", {
        x: 20,
        y,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      const pdfBytes = await pdfDoc.save();
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="lote_${loteId}.pdf"`,
        },
      });
    }

    currentPage.drawText("Producto", { x: 20, y, size: 12, font });
    currentPage.drawText("Cantidad", { x: 180, y, size: 12, font });
    currentPage.drawText("Costo Estimado", { x: 300, y, size: 12, font });

    y -= 15;

    currentPage.drawLine({
      start: { x: 20, y },
      end: { x: width - 20, y },
      thickness: 1,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 20;

    let costoTotal = 0;

    for (const consumo of lote.consumos) {
      const producto = consumo.producto;
      const precioUnitario = producto.precioUnitario || 0;
      const costo = precioUnitario * consumo.cantidad;

      costoTotal += costo;

      if (y < 80) {
        currentPage = pdfDoc.addPage([595.28, 841.89]);
        y = 800;

        currentPage.drawText("Producto", { x: 20, y, size: 12, font });
        currentPage.drawText("Cantidad", { x: 180, y, size: 12, font });
        currentPage.drawText("Costo Estimado", { x: 300, y, size: 12, font });

        y -= 20;
      }

      currentPage.drawText(producto.nombre, { x: 20, y, size: 12, font });
      currentPage.drawText(`${consumo.cantidad}`, {
        x: 180,
        y,
        size: 12,
        font,
      });

      currentPage.drawText(
        precioUnitario ? `$${costo.toFixed(2)}` : "Sin precio definido",
        {
          x: 300,
          y,
          size: 12,
          font,
          color: precioUnitario ? rgb(0, 0, 0) : rgb(0.5, 0.2, 0.2),
        }
      );

      y -= 20;
    }

    y -= 30;

    currentPage.drawLine({
      start: { x: 20, y },
      end: { x: width - 20, y },
      thickness: 1.5,
      color: rgb(0, 0.5, 0.2),
    });

    y -= 20;

    currentPage.drawText(`Costo Total Estimado del Lote:`, {
      x: 20,
      y,
      size: 14,
      font,
      color: rgb(0, 0.4, 0.1),
    });

    currentPage.drawText(
      costoTotal > 0 ? `$${costoTotal.toFixed(2)}` : "Sin datos suficientes",
      {
        x: 280,
        y,
        size: 14,
        font,
        color: rgb(0.1, 0.1, 0.1),
      }
    );

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lote_${loteId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ Error PDF lote:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
