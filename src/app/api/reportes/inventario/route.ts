import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        proveedor: true,
      },
      orderBy: { nombre: "asc" },
    });

    // ===========================
    // CREAR PDF
    // ===========================
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]); // Carta
    const { height } = page.getSize();

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = height - 60;

    // ===========================
    // ENCABEZADO PRO
    // ===========================
    page.drawText("REPORTE DE INVENTARIO AGRÍCOLA", {
      x: 50,
      y,
      size: 20,
      font: bold,
      color: rgb(0, 0.37, 0.17),
    });

    y -= 25;

    page.drawLine({
      start: { x: 50, y },
      end: { x: 562, y },
      thickness: 3,
      color: rgb(0, 0.37, 0.17),
    });

    y -= 30;

    // ===========================
    // TABLA – ENCABEZADOS
    // ===========================
    const headers = ["Producto", "Categoría", "Unidad", "Stock", "Precio", "Total"];
    const columnX = [50, 220, 330, 390, 450, 510];

    headers.forEach((h, i) => {
      page.drawText(h, {
        x: columnX[i],
        y,
        size: 10,
        font: bold,
      });
    });

    y -= 18;

    // ==================================
    // FUNCION PARA NUEVA PÁGINA
    // ==================================
    const newPage = () => {
      const p = pdf.addPage([612, 792]);
      const { height: h } = p.getSize();
      y = h - 60;

      p.drawText("REPORTE DE INVENTARIO AGRÍCOLA (cont.)", {
        x: 50,
        y,
        size: 16,
        font: bold,
        color: rgb(0, 0.37, 0.17),
      });

      y -= 30;

      headers.forEach((h, i) => {
        p.drawText(h, { x: columnX[i], y, size: 10, font: bold });
      });

      y -= 15;
      return p;
    };

    let currentPage = page;

    // ===========================
    // FILAS
    // ===========================
    for (const p of productos) {
      if (y < 60) currentPage = newPage();

      const precio = p.precioUnitario || 0;
      const total = precio * p.stock;

      const row = [
        p.nombre,
        p.categoria?.nombre || "-",
        p.unidad,
        String(p.stock),
        `$${precio.toFixed(2)}`,
        `$${total.toFixed(2)}`,
      ];

      row.forEach((txt, i) => {
        currentPage.drawText(txt, {
          x: columnX[i],
          y,
          size: 9,
          font,
        });
      });

      y -= 16;
    }

    // ===========================
    // FINAL
    // ===========================
    y -= 20;
    currentPage.drawText("Reporte generado automáticamente", {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    const pdfBytes = await pdf.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=inventario.pdf",
      },
    });
  } catch (e) {
    console.error("❌ Error PDF:", e);
    return NextResponse.json({ error: "Error generando PDF" }, { status: 500 });
  }
}
