import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET() {
  try {
    const compras = await prisma.compra.findMany({
      orderBy: { fecha: "desc" },
      include: { producto: true, proveedor: true },
    });

    // ============================
    // CREAR PDF + BUFFER
    // ============================
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    const safe = (val: any) =>
      val === null || val === undefined ? "" : String(val);

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {});

    // ============================
    // ENCABEZADO
    // ============================
    doc
      .fontSize(22)
      .fillColor("#0DE67B")
      .text("Reporte de Compras", { align: "center" });

    doc.moveDown();
    doc
      .fontSize(12)
      .fillColor("#ccc")
      .text("Fecha de generación: " + new Date().toLocaleString());

    doc.moveDown();
    doc
      .moveTo(40, doc.y)
      .lineTo(550, doc.y)
      .strokeColor("#0DE67B")
      .stroke();

    doc.moveDown(2);

    // ============================
    // LISTADO
    // ============================
    let totalGeneral = 0;

    compras.forEach((c) => {
      const costoUnit = Number(c.costo) || 0;
      const cantidad = Number(c.cantidad) || 0;
      const totalCompra = costoUnit * cantidad;

      totalGeneral += totalCompra;

      doc
        .fontSize(12)
        .fillColor("#0DE67B")
        .text(`Producto:`, { continued: true })
        .fillColor("#fff")
        .text(` ${safe(c.producto?.nombre)}`);

      doc
        .fillColor("#0DE67B")
        .text(`Proveedor:`, { continued: true })
        .fillColor("#fff")
        .text(` ${safe(c.proveedor?.nombre)}`);

      doc
        .fillColor("#0DE67B")
        .text(`Cantidad:`, { continued: true })
        .fillColor("#fff")
        .text(` ${cantidad}`);

      doc
        .fillColor("#0DE67B")
        .text(`Costo unitario:`, { continued: true })
        .fillColor("#fff")
        .text(` $${costoUnit}`);

      doc
        .fillColor("#0DE67B")
        .text(`Total compra:`, { continued: true })
        .fillColor("#fff")
        .text(` $${totalCompra.toFixed(2)}`);

      doc
        .fillColor("#0DE67B")
        .text(`Fecha:`, { continued: true })
        .fillColor("#fff")
        .text(` ${new Date(c.fecha).toLocaleDateString()}`);

      doc.moveDown();
      doc.fillColor("#444").text("-----------------------------------------------");
      doc.moveDown(1.5);

      if (doc.y > 750) {
        doc.addPage();
        doc.moveDown();
      }
    });

    // ============================
    // TOTAL GENERAL
    // ============================
    doc.moveDown();
    doc
      .fontSize(16)
      .fillColor("#0DE67B")
      .text(`Total General Gastado: $${totalGeneral.toFixed(2)}`);

    // ============================
    // FINALIZAR
    // ============================
    doc.end();
    await new Promise((resolve) => doc.on("end", resolve));

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=compras.pdf",
      },
    });
  } catch (error) {
    console.error("❌ Error PDF Compras:", error);
    return NextResponse.json(
      { error: "Error generando reporte de compras" },
      { status: 500 }
    );
  }
}
