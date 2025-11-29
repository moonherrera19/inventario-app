import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
        proveedor: true,
      },
      orderBy: { id: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inventario");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Producto", key: "producto", width: 30 },
      { header: "Categoría", key: "categoria", width: 25 },
      { header: "Proveedor", key: "proveedor", width: 25 },
      { header: "Unidad", key: "unidad", width: 15 },
      { header: "Stock", key: "stock", width: 12 },
      { header: "Stock Mínimo", key: "stockMinimo", width: 15 },
      { header: "Precio Unitario", key: "precioUnitario", width: 20 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2E7D32" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });

    productos.forEach((p) =>
      sheet.addRow({
        id: p.id,
        producto: p.nombre,
        categoria: p.categoria?.nombre || "—",
        proveedor: p.proveedor?.nombre || "—",
        unidad: p.unidad,
        stock: p.stock,
        stockMinimo: p.stockMinimo,
        precioUnitario: p.precioUnitario || 0,
      })
    );

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=inventario.xlsx",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error en Inventario" }, { status: 500 });
  }
}
