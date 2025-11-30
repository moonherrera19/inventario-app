import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        proveedor: true,
      },
    });

    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => {});

    doc.fontSize(22).fillColor("#0DE67B").text("Reporte de Productos", { align: "center" });
    doc.moveDown();

    productos.forEach(p => {
      doc.fontSize(11).fillColor("#FFF").text(`
Producto: ${p.nombre}
Categoría: ${p.categoria?.nombre || "-"}
Proveedor: ${p.proveedor?.nombre || "-"}
Unidad: ${p.unidad}
Stock: ${p.stock}
Stock Mínimo: ${p.stockMinimo}
---------------------------------------------
`);
    });

    doc.end();
    return new Response(Buffer.concat(chunks), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=productos.pdf",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Error generando PDF" }, { status: 500 });
  }
}
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        proveedor: true,
      },
    });

    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => {});

    // Título
    doc.fontSize(22)
      .fillColor("#0DE67B")
      .text("Reporte de Productos", { align: "center" });

    doc.moveDown();

    // Contenido
    productos.forEach((p) => {
      doc.fontSize(11).fillColor("#FFFFFF").text(
        `Producto: ${p.nombre}
Categoría: ${p.categoria?.nombre || "-"}
Proveedor: ${p.proveedor?.nombre || "-"}
Unidad: ${p.unidad}
Stock: ${p.stock}
Stock Mínimo: ${p.stockMinimo}
---------------------------------------------`
      );

      doc.moveDown(0.5);
    });

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=productos.pdf",
      },
    });

  } catch (error) {
    console.error("❌ Error PDF productos:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
