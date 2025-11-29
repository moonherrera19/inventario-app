import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) return NextResponse.json({ preview: [] });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];

    const preview = [];
    const errores = [];

    sheet.eachRow((row, index) => {
      if (index === 1) return; // encabezado

      const nombre = row.getCell(1).value?.toString().trim();
      const unidad = row.getCell(2).value?.toString().trim();
      const stock = Number(row.getCell(3).value || 0);
      const stockMinimo = Number(row.getCell(4).value || 0);

      if (!nombre || !unidad) {
        errores.push({ fila: index, error: "Campos obligatorios vacíos" });
      }

      preview.push({ nombre, unidad, stock, stockMinimo });
    });

    return NextResponse.json({ preview, errores });
  } catch (err) {
    console.error(err);    
    return NextResponse.json({ preview: [] });
  }
}
