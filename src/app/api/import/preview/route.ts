import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió archivo" },
        { status: 400 }
      );
    }

    // Convertir archivo → ArrayBuffer → Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer); // ✔ compatible 100% con Vercel

    // Cargar Excel usando Uint8Array (NO buffer)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(uint8); // ✔ ESTA ES LA CLAVE

    const sheet = workbook.worksheets[0];
    const rows: any[] = [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      rows.push({
        index: rowNumber,
        values: row.values,
      });
    });

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("❌ Error leyendo Excel:", error);
    return NextResponse.json(
      { error: "Error procesando archivo" },
      { status: 500 }
    );
  }
}
