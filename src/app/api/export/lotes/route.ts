import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const data = await prisma.lote.findMany({
      orderBy: { id: "asc" },
      include: {
        consumos: true,
      },
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Lotes");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Nombre", key: "nombre", width: 25 },
      { header: "Cultivo", key: "cultivo", width: 20 },
      { header: "Área (Ha)", key: "area", width: 15 },
      { header: "Total Consumos", key: "consumos", width: 18 },
    ];

    sheet.getRow(1).eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "2E7D32" } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    data.forEach((l) =>
      sheet.addRow({
        id: l.id,
        nombre: l.nombre,
        cultivo: l.cultivo || "—",
        area: l.areaHa || 0,
        consumos: l.consumos?.length || 0,
      })
    );

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=lotes.xlsx",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Error en Lotes" }, { status: 500 });
  }
}
