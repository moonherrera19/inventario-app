import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const data = await prisma.categoria.findMany({
      orderBy: { id: "asc" },
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Categorías");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Categoría", key: "categoria", width: 30 },
      { header: "Descripción", key: "descripcion", width: 40 },
    ];

    sheet.getRow(1).eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "388E3C" } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    data.forEach((c) =>
      sheet.addRow({
        id: c.id,
        categoria: c.nombre,
        descripcion: c.descripcion || "—",
      })
    );

    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=categorias.xlsx",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Error en Categorías" }, { status: 500 });
  }
}
