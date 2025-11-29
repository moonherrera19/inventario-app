import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: { categoria: true, proveedor: true },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Productos");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Producto", key: "nombre", width: 25 },
      { header: "Categoría", key: "categoria", width: 20 },
      { header: "Proveedor", key: "proveedor", width: 20 },
      { header: "Unidad", key: "unidad", width: 10 },
      { header: "Stock", key: "stock", width: 12 },
      { header: "Stock Mínimo", key: "min", width: 15 },
    ];

    sheet.getRow(1).eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F2B" } };
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    productos.forEach((p) =>
      sheet.addRow({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || "-",
        proveedor: p.proveedor?.nombre || "-",
        unidad: p.unidad,
        stock: p.stock,
        min: p.stockMinimo,
      })
    );

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=productos.xlsx",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Error Excel" }, { status: 500 });
  }
}
