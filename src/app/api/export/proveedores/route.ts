import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const data = await prisma.proveedor.findMany({
      orderBy: { id: "asc" },
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Proveedores");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Proveedor", key: "proveedor", width: 30 },
      { header: "Teléfono", key: "telefono", width: 20 },
      { header: "Dirección", key: "direccion", width: 40 },
    ];

    sheet.getRow(1).eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1B5E20" } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    data.forEach((p) =>
      sheet.addRow({
        id: p.id,
        proveedor: p.nombre,
        telefono: p.telefono || "—",
        direccion: p.direccion || "—",
      })
    );

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=proveedores.xlsx",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Error en Proveedores" }, { status: 500 });
  }
}
