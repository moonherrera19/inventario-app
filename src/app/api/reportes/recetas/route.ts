import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET() {
  try {
    const recetas = await prisma.receta.findMany({
      orderBy: { id: "desc" },
      include: {
        ingredientes: {
          include: {
            producto: true,
          },
        },
      },
    });

    // ============================================================
    // CREAR PDF
    // ============================================================
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {});

    // TÍTULO
    doc
      .fontSize(22)
      .fillColor("#0DE67B")
      .text("Reporte de Recetas", { align: "center" });

    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor("#FFFFFF")
      .text("Fecha de generación: " + new Date().toLocaleString());

    doc.moveDown();

    recetas.forEach((receta) => {
      doc
        .fontSize(16)
        .fillColor("#0DE67B")
        .text(`🍃 Receta: ${receta.nombre}`);

      doc.moveDown(0.5);

      doc
        .fontSize(12)
        .fillColor("#FFFFFF")
        .text("Ingredientes:", { underline: true });

      doc.moveDown(0.3);

      let totalReceta = 0;

      receta.ingredientes.forEach((ing) => {
        const costoUnit =
          ing.producto?.costo || 0; // Si no hay costo en producto
        const subtotal = costoUnit * ing.cantidad;
        totalReceta += subtotal;

        doc
          .fontSize(11)
          .fillColor("#FFFFFF")
          .text(
            `• ${ing.producto?.nombre || "Producto"} — ${ing.cantidad} ${
              ing.unidad
            } (Costo: $${subtotal.toFixed(2)})`
          );
      });

      doc.moveDown();

      // TOTAL DE LA RECETA
      doc
        .fontSize(13)
        .fillColor("#0DE67B")
        .text(`Costo total de esta receta: $${totalReceta.toFixed(2)}`);

      doc.moveDown(1);
      doc
        .fillColor("#444")
        .text("-----------------------------------------------");

      doc.moveDown(1);
    });

    doc.end();

    await new Promise<void>((resolve) => doc.on("end", resolve));
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=recetas.pdf",
      },
    });
  } catch (error) {
    console.error("❌ Error generando reporte de recetas:", error);
    return NextResponse.json(
      { error: "Error generando reporte de recetas" },
      { status: 500 }
    );
  }
}
