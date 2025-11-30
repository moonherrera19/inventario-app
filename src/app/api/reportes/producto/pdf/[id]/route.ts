// app/api/reportes/producto/pdf/[id]/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const numericId = Number(id);

    if (!numericId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const producto = await prisma.producto.findUnique({
      where: { id: numericId },
      include: {
        categoria: true,
        proveedor: true,
      },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => {});

    doc
      .fontSize(22)
      .fillColor("#0DE67B")
      .text("Ficha del Producto", { align: "center" });

    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor("#FFFFFF")
      .text(`
ID: ${producto.id}
Nombre: ${producto.nombre}
Categoría: ${producto.categoria?.nombre || "-"}
Proveedor: ${producto.proveedor?.nombre || "-"}
Unidad: ${producto.unidad}
Stock actual: ${producto.stock}
Stock mínimo: ${producto.stockMinimo}
Precio unitario: ${producto.precioUnitario ?? "N/D"}

---------------------------------------------
`);

    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=producto_${numericId}.pdf`,
      },
    });
  } catch (error) {
    console.error("❌ Error PDF producto:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
