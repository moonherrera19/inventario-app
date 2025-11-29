import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const data = await prisma.salida.findMany({
      include: { producto: true },
      orderBy: { fecha: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Salidas");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Producto", key: "producto", width: 30 },
      { header: "Cantidad", key: "cantidad", width: 15 },
      { header: "Fecha", key: "fecha", width: 20 },
    ];

    sheet.getRow(1).eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "2E7D32" } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.alignment = { horizontal: "center" };
    });

    data.forEach((e) =>
      sheet.addRow({
        id: e.id,
        producto: e.producto.nombre,
        cantidad: e.cantidad,
        fecha: new Date(e.fecha).toLocaleDateString(),
      })
    );

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=salidas.xlsx",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Error en Salidas" }, { status: 500 });
  }
}
