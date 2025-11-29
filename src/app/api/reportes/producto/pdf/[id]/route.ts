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
