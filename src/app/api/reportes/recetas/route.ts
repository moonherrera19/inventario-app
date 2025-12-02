import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET() {
  try {
    const recetas = await prisma.receta.findMany({
      orderBy: { id: "desc" },
      include: {
        ingredientes: {
          include: { producto: true },
        },
      },
    });

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {});

    const safe = (v: any) =>
      v === undefined || v === null || v === "" ? "N/A" : String(v);

    const num = (v: any) =>
      v === undefined || v === null || isNaN(Number(v)) ? 0 : Number(v);

    // =============================
    // ENCABEZADO
    // =============================
    doc
      .fontSize(22)
      .fillColor("#0DE67B")
      .text("REPORTE DE RECETAS", { align: "center" });

    doc.moveDown();
    doc
      .moveTo(40, doc.y)
      .lineTo(550, doc.y)
      .strokeColor("#0DE67B")
      .stroke();
    doc.moveDown(1.5);

    // =============================
    // TABLA: RECETAS UNA A UNA
    // =============================
    recetas.forEach((receta) => {
      doc
        .fontSize(16)
        .fillColor("#0DE67B")
        .text(`🍃 ${safe(receta.nombre)}`);

      doc.moveDown(0.2);

      doc
        .fontSize(12)
        .fillColor("#FFFFFF")
        .text("Ingredientes:", { underline: true });

      doc.moveDown(0.6);

      // Encabezado de tabla
      doc.fontSize(11).fillColor("#0DE67B");
      doc.text("Producto", 40, doc.y, { width: 200 });
      doc.text("Cantidad", 240, doc.y, { width: 100 });
      doc.text("Unidad", 340, doc.y, { width: 100 });
      doc.text("Costo", 440, doc.y, { width: 100 });

      doc.moveDown(0.3);
      doc
        .moveTo(40, doc.y)
        .lineTo(550, doc.y)
        .strokeColor("#0DE67B")
        .stroke();

      doc.moveDown(0.3);

      let totalReceta = 0;

      receta.ingredientes.forEach((ing) => {
        const producto = ing.producto;

        const nombre = safe(producto?.nombre);
        const cantidad = num(ing.cantidad);
        const unidad = safe(producto?.unidad);
        const costoUnit = num(producto?.precioUnitario);
        const subtotal = cantidad * costoUnit;

        totalReceta += subtotal;

        // FILAS
        doc.fontSize(11).fillColor("#FFFFFF");
        doc.text(nombre, 40, doc.y, { width: 200 });
        doc.text(String(cantidad), 240, doc.y, { width: 100 });
        doc.text(unidad, 340, doc.y, { width: 100 });
        doc.text(`$${subtotal.toFixed(2)}`, 440, doc.y, { width: 100 });

        doc.moveDown(0.5);

        // Salto de página
        if (doc.y > 740) {
          doc.addPage();
        }
      });

      // TOTAL DE RECETA
      doc.moveDown(0.4);
      doc.fontSize(13).fillColor("#0DE67B");
      doc.text(`Total receta: $${totalReceta.toFixed(2)}`);

      doc.moveDown(1);
      doc
        .moveTo(40, doc.y)
        .lineTo(550, doc.y)
        .strokeColor("#444")
        .stroke();

      doc.moveDown(1);
    });

    doc.end();
    await new Promise((resolve) => doc.on("end", resolve));

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=reporte-recetas.pdf",
      },
    });
  } catch (error) {
    console.error("❌ Error PDF Recetas:", error);
    return NextResponse.json(
      { error: "Error generando reporte de recetas" },
      { status: 500 }
    );
  }
}
