import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo") || "diario";

    const hoy = new Date();
    let desde = new Date();

    if (tipo === "diario") desde.setDate(hoy.getDate() - 1);
    if (tipo === "semanal") desde.setDate(hoy.getDate() - 7);
    if (tipo === "mensual") desde.setMonth(hoy.getMonth() - 1);

    const entradas = await prisma.entrada.findMany({
      where: { fecha: { gte: desde } },
      include: { producto: true },
    });

    const salidas = await prisma.salida.findMany({
      where: { fecha: { gte: desde } },
      include: { producto: true },
    });

    const compras = await prisma.compra.findMany({
      where: { fecha: { gte: desde } },
      include: { producto: true, proveedor: true },
    });

    const consumos = await prisma.consumo.findMany({
      where: { fecha: { gte: desde } },
      include: { producto: true, lote: true },
    });

    // ============================
    // PDF + BUFFER
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
      .fillColor("#22c55e")
      .text("Reporte Agrícola", { align: "center" });

    doc.moveDown();
    doc
      .fontSize(12)
      .fillColor("#ddd")
      .text(`Periodo: ${tipo.toUpperCase()}`, { align: "center" });

    doc.moveDown();
    doc
      .moveTo(40, doc.y)
      .lineTo(550, doc.y)
      .strokeColor("#22c55e")
      .stroke();

    doc.moveDown(2);

    // ============================
    // TABLA SEGURA
    // ============================
    const drawTable = (title: string, headers: string[], rows: any[]) => {
      if (!rows || rows.length === 0) return;

      doc.fontSize(16).fillColor("#22c55e").text(title);
      doc.moveDown(0.5);

      doc.fontSize(11).fillColor("#22c55e");

      const colWidth = (550 - 40) / headers.length;

      headers.forEach((h, i) => {
        doc.text(h, 40 + i * colWidth, doc.y, { width: colWidth });
      });

      doc.moveDown(1);
      doc.fillColor("#fff");

      rows.forEach((row) => {
        headers.forEach((h, i) => {
          doc.text(safe(row[h]), 40 + i * colWidth, doc.y, {
            width: colWidth,
          });
        });

        doc.moveDown(0.7);

        if (doc.y > 750) {
          doc.addPage();
          doc.moveDown();
        }
      });

      doc.moveDown(2);
    };

    // ============================
    // SECCIONES
    // ============================
    drawTable(
      "Entradas",
      ["producto", "cantidad", "fecha"],
      entradas.map((e) => ({
        producto: safe(e.producto?.nombre),
        cantidad: safe(e.cantidad),
        fecha: new Date(e.fecha).toLocaleDateString(),
      }))
    );

    drawTable(
      "Salidas",
      ["producto", "cantidad", "fecha"],
      salidas.map((s) => ({
        producto: safe(s.producto?.nombre),
        cantidad: safe(s.cantidad),
        fecha: new Date(s.fecha).toLocaleDateString(),
      }))
    );

    drawTable(
      "Compras",
      ["producto", "proveedor", "costo"],
      compras.map((c) => ({
        producto: safe(c.producto?.nombre),
        proveedor: safe(c.proveedor?.nombre),
        costo: `$${(c.costo * c.cantidad).toFixed(2)}`,
      }))
    );

    drawTable(
      "Consumos",
      ["lote", "producto", "cantidad"],
      consumos.map((c) => ({
        lote: safe(c.lote?.nombre),
        producto: safe(c.producto?.nombre),
        cantidad: safe(c.cantidad),
      }))
    );

    // ============================
    // FINALIZAR
    // ============================
    doc.end();
    await new Promise((resolve) => doc.on("end", resolve));

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=reporte.pdf",
      },
    });
  } catch (error) {
    console.error("❌ Error PDF general:", error);
    return NextResponse.json(
      { message: "Error al generar PDF" },
      { status: 500 }
    );
  }
}
