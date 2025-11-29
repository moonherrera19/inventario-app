import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const data = await prisma.receta.findMany({
      include: {
        ingredientes: {
          include: { producto: true },
        },
      },
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Recetas");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Receta", key: "receta", width: 30 },
      { header: "Ingredientes", key: "ingredientes", width: 60 },
    ];

    sheet.getRow(1).eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1B5E20" } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    data.forEach((r) =>
      sheet.addRow({
        id: r.id,
        receta: r.nombre,
        ingredientes: r.ingredientes
          .map((i) => `${i.producto.nombre} (${i.cantidad})`)
          .join(", "),
      })
    );

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=recetas.xlsx",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Error en Recetas" }, { status: 500 });
  }
}
