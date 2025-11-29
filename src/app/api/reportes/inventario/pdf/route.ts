// app/api/reportes/inventario/pdf/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearPDFBase } from "@/lib/pdf/basePDF";
import { rgb } from "pdf-lib";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        proveedor: true,
      },
      orderBy: { nombre: "asc" }
    });

    const { pdfDoc, page, width, height, font } = await crearPDFBase();

    let y = height - 120;

    // TÍTULO
    page.drawText("REPORTE DE INVENTARIO AGRÍCOLA", {
      x: 20,
      y,
      size: 18,
      font,
      color: rgb(0, 0.5, 0.2),
    });

    y -= 35;

    // ENCABEZADOS DE TABLA
    page.drawText("Producto", { x: 20, y, size: 12, font });
    page.drawText("Categoría", { x: 140, y, size: 12, font });
    page.drawText("Stock", { x: 250, y, size: 12, font });
    page.drawText("Unidad", { x: 310, y, size: 12, font });
    page.drawText("Precio Unit.", { x: 380, y, size: 12, font });
    page.drawText("Valor Total", { x: 480, y, size: 12, font });

    y -= 15;

    // Línea separadora
    page.drawLine({
      start: { x: 20, y },
      end: { x: width - 20, y },
      thickness: 1,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 20;

    let valorInventario = 0;
    let productosBajoMinimo = 0;

    productos.forEach((p) => {
      const precio = p.precioUnitario || 0;
      const valorTotal = precio * p.stock;

      valorInventario += valorTotal;
      if (p.stock < p.stockMinimo) productosBajoMinimo++;

      // Producto
      page.drawText(p.nombre, { x: 20, y, size: 12, font });

      // Categoría
      page.drawText(p.categoria?.nombre || "-", {
        x: 140,
        y,
        size: 12,
        font,
      });

      // Stock
      page.drawText(`${p.stock}`, { x: 250, y, size: 12, font });

      // Unidad
      page.drawText(p.unidad, { x: 310, y, size: 12, font });

      // Precio unitario
      page.drawText(
        precio ? `$${precio.toFixed(2)}` : "N/D",
        {
          x: 380,
          y,
          size: 12,
          font,
          color: precio ? rgb(0, 0, 0) : rgb(0.6, 0.2, 0.2),
        }
      );

      // Valor total
      page.drawText(
        precio ? `$${valorTotal.toFixed(2)}` : "N/D",
        {
          x: 480,
          y,
          size: 12,
          font,
          color: precio ? rgb(0, 0, 0) : rgb(0.6, 0.2, 0.2),
        }
      );

      y -= 18;

      // Página nueva si se llena
      if (y < 80) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        y = 800;
      }
    });

    // ESPACIO FINAL
    y -= 30;

    // SECCIÓN RESUMEN
    page.drawText("RESUMEN DEL INVENTARIO", {
      x: 20,
      y,
      size: 16,
      font,
      color: rgb(0.1, 0.4, 0.2),
    });

    y -= 25;

    page.drawText(
      `Valor total estimado del inventario: $${valorInventario.toFixed(2)}`,
      {
        x: 20,
        y,
        size: 14,
        font,
      }
    );

    y -= 20;

    page.drawText(
      `Productos por debajo del stock mínimo: ${productosBajoMinimo}`,
      {
        x: 20,
        y,
        size: 14,
        font,
        color: productosBajoMinimo > 0 ? rgb(0.7, 0.2, 0.2) : rgb(0, 0.5, 0.2),
      }
    );

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="inventario_general.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ PDF inventario:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
