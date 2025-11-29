import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// ============================================================
// GET → Generar PDF o Excel según el parámetro ?format=
// ============================================================
//
// Ejemplos:
// /api/reportes/compras?format=pdf
// /api/reportes/compras?format=excel
// ============================================================

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "pdf";

    const compras = await prisma.compra.findMany({
      orderBy: { fecha: "desc" },
      include: {
        producto: true,
        proveedor: true,
      },
    });

    // ===========================
    //  GENERAR PDF
    // ===========================
    if (format === "pdf") {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () =>
        new NextResponse(Buffer.concat(chunks), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=compras.pdf",
          },
        })
      );

      // TÍTULO
      doc
        .fontSize(22)
        .fillColor("#0DE67B")
        .text("Reporte de Compras", { align: "center" });

      doc.moveDown();

      // ENCABEZADO
      doc
        .fontSize(12)
        .fillColor("#FFFFFF")
        .text("Fecha de generación: " + new Date().toLocaleString());

      doc.moveDown();

      // TABLA
      doc.fontSize(13).fillColor("#0DE67B").text("Listado de Compras:", {
        underline: true,
      });

      doc.moveDown(0.5);

      doc.fontSize(10).fillColor("#FFFFFF");

      let totalGeneral = 0;

      compras.forEach((c) => {
        const linea = `
Producto: ${c.producto?.nombre}
Proveedor: ${c.proveedor?.nombre}
Cantidad: ${c.cantidad}
Costo: $${c.costo}
Fecha: ${new Date(c.fecha).toLocaleString()}
-----------------------------------------------
`;

        totalGeneral += Number(c.costo);
        doc.text(linea);
      });

      // TOTAL FINAL
      doc.moveDown();
      doc
        .fontSize(14)
        .fillColor("#0DE67B")
        .text("Total gastado: $" + totalGeneral.toFixed(2));

      doc.end();
      return new Response(Buffer.concat(chunks), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=compras.pdf",
        },
      });
    }

    // ===========================
    //  GENERAR EXCEL
    // ===========================
    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Compras");

      // ENCABEZADOS
      sheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Producto", key: "producto", width: 30 },
        { header: "Proveedor", key: "proveedor", width: 30 },
        { header: "Cantidad", key: "cantidad", width: 15 },
        { header: "Costo ($)", key: "costo", width: 15 },
        { header: "Fecha", key: "fecha", width: 25 },
      ];

      // ESTILO ENCABEZADO
      sheet.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF065F2B" }, // VERDE OSCURO PRO
        };
        cell.font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFFFFFFF" } },
          left: { style: "thin", color: { argb: "FFFFFFFF" } },
          bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
          right: { style: "thin", color: { argb: "FFFFFFFF" } },
        };
      });

      let totalGeneral = 0;

      // FILAS
      compras.forEach((c) => {
        totalGeneral += Number(c.costo);

        sheet.addRow({
          id: c.id,
          producto: c.producto?.nombre,
          proveedor: c.proveedor?.nombre,
          cantidad: c.cantidad,
          costo: c.costo,
          fecha: new Date(c.fecha).toLocaleString(),
        });
      });

      // TOTAL
      const totalRow = sheet.addRow({
        producto: "TOTAL GENERAL",
        costo: totalGeneral.toFixed(2),
      });

      totalRow.font = { bold: true, color: { argb: "FF065F2B" } };

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=compras.xlsx",
        },
      });
    }

    return NextResponse.json(
      { error: "Formato no válido (usa pdf o excel)" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error en reportes de compras:", error);
    return NextResponse.json(
      { error: "Error generando reporte de compras" },
      { status: 500 }
    );
  }
}
