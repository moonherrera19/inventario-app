import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET(req: Request) {
  try {
    // Leer tipo del query
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo") || "diario";

    // -----------------------------
    // FILTROS POR TIPO
    // -----------------------------
    const hoy = new Date();
    let desde = new Date();

    if (tipo === "diario") {
      desde.setDate(hoy.getDate() - 1);
    } else if (tipo === "semanal") {
      desde.setDate(hoy.getDate() - 7);
    } else if (tipo === "mensual") {
      desde.setMonth(hoy.getMonth() - 1);
    }

    // -----------------------------
    // OBTENER DATOS
    // -----------------------------
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

    // -----------------------------
    // CREAR PDF
    // -----------------------------
    const doc = new PDFDocument({ margin: 40 });

    // Stream para devolver PDF
    const stream = doc;

    // -----------------------------
    // ENCABEZADO BONITO
    // -----------------------------
    doc
      .fontSize(22)
      .fillColor("#22c55e")
      .text("Reporte Agrícola", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .fillColor("#ccc")
      .text(`Tipo: ${tipo.toUpperCase()}`, { align: "center" });
    doc.moveDown(1);

    // Línea verde
    doc
      .moveTo(40, doc.y)
      .lineTo(550, doc.y)
      .strokeColor("#22c55e")
      .stroke();
    doc.moveDown(1.5);

    // ===================================================
    // FUNCIÓN PARA TABLAS BONITAS
    // ===================================================
    const drawTable = (titulo: string, headers: string[], rows: any[]) => {
      if (!rows || rows.length === 0) return;

      doc
        .fontSize(16)
        .fillColor("#22c55e")
        .text(titulo, { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(11).fillColor("#ffffff");

      // Encabezados
      doc.fillColor("#22c55e");
      headers.forEach((h, i) => {
        doc.text(h, 40 + i * 150, doc.y, { width: 140 });
      });

      doc.moveDown(1);

      // Filas
      doc.fillColor("#ddd");
      rows.forEach((r) => {
        const vals = Object.values(r);
        vals.forEach((val: any, i: number) => {
          doc.text(String(val), 40 + i * 150, doc.y, {
            width: 140,
            continued: false,
          });
        });
        doc.moveDown(0.5);

        // Salto de página si es necesario
        if (doc.y > 720) doc.addPage();
      });

      doc.moveDown(1.5);
    };

    // ===================================================
    // TABLAS
    // ===================================================

    drawTable(
      "Entradas",
      ["Producto", "Cantidad", "Fecha"],
      entradas.map((e) => ({
        producto: e.producto.nombre,
        cantidad: e.cantidad,
        fecha: new Date(e.fecha).toLocaleDateString(),
      }))
    );

    drawTable(
      "Salidas",
      ["Producto", "Cantidad", "Fecha"],
      salidas.map((s) => ({
        producto: s.producto.nombre,
        cantidad: s.cantidad,
        fecha: new Date(s.fecha).toLocaleDateString(),
      }))
    );

    drawTable(
      "Compras",
      ["Producto", "Proveedor", "Costo Total"],
      compras.map((c) => ({
        producto: c.producto.nombre,
        proveedor: c.proveedor.nombre,
        costo: `$${(c.costo * c.cantidad).toFixed(2)}`,
      }))
    );

    drawTable(
      "Consumos por lote",
      ["Lote", "Producto", "Cantidad"],
      consumos.map((c) => ({
        lote: c.lote.nombre,
        producto: c.producto.nombre,
        cantidad: c.cantidad,
      }))
    );

    // FINALIZAR
    doc.end();

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=reporte-${tipo}.pdf`,
      },
    });
  } catch (error) {
    console.error("❌ Error PDF:", error);
    return NextResponse.json(
      { message: "Error al generar PDF" },
      { status: 500 }
    );
  }
}
