import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET() {
  try {
    const compras = await prisma.compra.findMany({
      orderBy: { fecha: "desc" },
      include: {
        producto: true,
        proveedor: true,
      },
    });

    // ============================================================
    // GENERAR PDF
    // ============================================================
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {});

    // ENCABEZADO
    doc
      .fontSize(22)
      .fillColor("#0DE67B")
      .text("Reporte de Compras", { align: "center" });

    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor("#FFFFFF")
      .text("Fecha de generación: " + new Date().toLocaleString());

    doc.moveDown();

    doc
      .fontSize(14)
      .fillColor("#0DE67B")
      .text("Listado de Compras", { underline: true });

    doc.moveDown(0.5);

    let totalGeneral = 0;

    compras.forEach((c) => {
      const totalCompra = Number(c.costo) * Number(c.cantidad);
      totalGeneral += totalCompra;

      doc
        .fontSize(10)
        .fillColor("#FFFFFF")
        .text(`Producto: ${c.producto?.nombre}`)
        .text(`Proveedor: ${c.proveedor?.nombre}`)
        .text(`Cantidad: ${c.cantidad}`)
        .text(`Costo unitario: $${c.costo}`)
        .text(`Total compra: $${totalCompra.toFixed(2)}`)
        .text(`Fecha: ${new Date(c.fecha).toLocaleDateString()}`)
        .moveDown()
        .text("-----------------------------------------------")
        .moveDown();
    });

    // TOTAL GENERAL
    doc.moveDown();
    doc
      .fontSize(16)
      .fillColor("#0DE67B")
      .text("Total General Gastado: $" + totalGeneral.toFixed(2));

    doc.end();

    await new Promise<void>((resolve) => doc.on("end", resolve));

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=compras.pdf",
      },
    });
  } catch (error) {
    console.error("❌ Error en reportes de compras:", error);
    return NextResponse.json(
      { error: "Error generando reporte de compras" },
      { status: 500 }
    );
  }
}
