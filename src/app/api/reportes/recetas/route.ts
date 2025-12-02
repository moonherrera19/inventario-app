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

    // ============================
    // CREAR PDF + BUFFER
    // ============================
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    const safe = (v: any) =>
      v === undefined || v === null ? "" : String(v);

    // ******* FIX IMPORTANTE *******

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {});

    // ============================
    // ENCABEZADO
    // ============================
    doc
      .fontSize(22)
      .fillColor("#0DE67B")
      .text("Reporte de Recetas", { align: "center" });

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
    // RECETAS
    // ============================
    recetas.forEach((receta) => {
      doc
        .fontSize(16)
        .fillColor("#0DE67B")
        .text(`🍃 Receta: ${safe(receta.nombre)}`);

      doc.moveDown(0.5);

      let totalReceta = 0;

      doc
        .fontSize(12)
        .fillColor("#FFFFFF")
        .text("Ingredientes:", { underline: true });

      doc.moveDown(0.5);

      receta.ingredientes.forEach((ing) => {
        const costoUnit = Number(ing.producto?.precioUnitario) || 0;
        const cantidad = Number(ing.cantidad) || 0;
        const subtotal = costoUnit * cantidad;
        totalReceta += subtotal;

        doc
          .fontSize(11)
          .fillColor("#FFFFFF")
          .text(
            `• ${safe(ing.producto?.nombre)} — ${cantidad} ${safe(
              ing.producto?.unidad
            )} (Costo: $${subtotal.toFixed(2)})`
          );

        if (doc.y > 750) {
          doc.addPage();
          doc.moveDown();
        }
      });

      doc.moveDown();
      doc
        .fontSize(13)
        .fillColor("#0DE67B")
        .text(`Costo total de la receta: $${totalReceta.toFixed(2)}`);

      doc.moveDown(1.5);

      doc.fillColor("#444").text("-----------------------------------------------");
      doc.moveDown(1);

      if (doc.y > 750) {
        doc.addPage();
        doc.moveDown();
      }
    });

    // ============================
    // FINALIZAR PDF
    // ============================
    doc.end();
    await new Promise((resolve) => doc.on("end", resolve));

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=recetas.pdf",
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
