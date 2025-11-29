
// app/api/reportes/lote/pdf/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearPDFBase } from "@/lib/pdf/basePDF";
import { rgb } from "pdf-lib";

export async function GET(req: Request, { params }) {
  try {
    const loteId = Number(params.id);

    if (!loteId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Buscar lote con consumos y productos
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

    // Iniciar PDF
    const { pdfDoc, page, width, height, font } = await crearPDFBase();
    let y = height - 120;

    // Título
    page.drawText(`REPORTE DE LOTE`, {
      x: 20,
      y,
      size: 18,
      font,
      color: rgb(0, 0.5, 0.2),
    });

    y -= 30;

    // Información del lote
    page.drawText(`Nombre del lote: ${lote.nombre}`, {
      x: 20,
      y,
      size: 14,
      font,
    });

    y -= 20;

    page.drawText(`Cultivo: ${lote.cultivo || "No especificado"}`, {
      x: 20,
      y,
      size: 14,
      font,
    });

    y -= 20;

    page.drawText(`Área: ${lote.areaHa ?? 0} ha`, {
      x: 20,
      y,
      size: 14,
      font,
    });

    y -= 40;

    // 🧾 Tabla de consumos
    page.drawText(`CONSUMOS AGRÍCOLAS`, {
      x: 20,
      y,
      size: 16,
      font,
      color: rgb(0.1, 0.4, 0.2),
    });

    y -= 25;

    if (lote.consumos.length === 0) {
      page.drawText("Este lote no tiene consumos registrados.", {
        x: 20,
        y,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      const pdfBytes = await pdfDoc.save();
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="lote_${loteId}.pdf"`,
        },
      });
    }

    // Encabezado tabla
    page.drawText("Producto", { x: 20, y, size: 12, font });
    page.drawText("Cantidad", { x: 180, y, size: 12, font });
    page.drawText("Costo Estimado", { x: 300, y, size: 12, font });

    y -= 15;

    // Línea separadora
    page.drawLine({
      start: { x: 20, y },
      end: { x: width - 20, y },
      thickness: 1,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 20;

    let costoTotal = 0;

    lote.consumos.forEach((consumo) => {
      const producto = consumo.producto;
      const precioUnitario = producto.precioUnitario || 0;
      const costo = precioUnitario * consumo.cantidad;

      costoTotal += costo;

      page.drawText(producto.nombre, { x: 20, y, size: 12, font });

      page.drawText(`${consumo.cantidad}`, {
        x: 180,
        y,
        size: 12,
        font,
      });

      page.drawText(
        precioUnitario
          ? `$${costo.toFixed(2)}`
          : "Sin precio definido",
        {
          x: 300,
          y,
          size: 12,
          font,
          color: precioUnitario ? rgb(0, 0, 0) : rgb(0.5, 0.2, 0.2),
        }
      );

      y -= 20;

      // Nueva página si se llena
      if (y < 80) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        y = 800;
      }
    });

    y -= 30;

    // TOTAL
    page.drawLine({
      start: { x: 20, y },
      end: { x: width - 20, y },
      thickness: 1.5,
      color: rgb(0, 0.5, 0.2),
    });

    y -= 20;

    page.drawText(`Costo Total Estimado del Lote:`, {
      x: 20,
      y,
      size: 14,
      font,
      color: rgb(0, 0.4, 0.1),
    });

    page.drawText(
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

    return new NextResponse(pdfBytes, {
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
