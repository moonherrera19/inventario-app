import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const data = await prisma.compra.findMany({
      include: { producto: true, proveedor: true },
      orderBy: { fecha: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Compras");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Proveedor", key: "proveedor", width: 25 },
      { header: "Producto", key: "producto", width: 30 },
      { header: "Costo", key: "costo", width: 15 },
      { header: "Cantidad", key: "cantidad", width: 15 },
      { header: "Fecha", key: "fecha", width: 20 },
    ];

    sheet.getRow(1).eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "388E3C" } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    data.forEach((c) =>
      sheet.addRow({
        id: c.id,
        proveedor: c.proveedor.nombre,
        producto: c.producto.nombre,
        costo: c.costo,
        cantidad: c.cantidad,
        fecha: new Date(c.fecha).toLocaleDateString(),
      })
    );

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=compras.xlsx",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Error en Compras" }, { status: 500 });
  }
}
