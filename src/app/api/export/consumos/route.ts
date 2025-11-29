import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const consumos = await prisma.consumo.findMany({
      include: { lote: true, producto: true },
      orderBy: { id: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Consumos");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Lote", key: "lote", width: 20 },
      { header: "Producto", key: "producto", width: 25 },
      { header: "Cantidad", key: "cantidad", width: 15 },
      { header: "Fecha", key: "fecha", width: 25 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F2B" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    consumos.forEach((c) => {
      sheet.addRow({
        id: c.id,
        lote: c.lote?.nombre,
        producto: c.producto?.nombre,
        cantidad: c.cantidad,
        fecha: new Date(c.fecha).toLocaleString(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=consumos.xlsx",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Error generando Excel" }, { status: 500 });
  }
}
