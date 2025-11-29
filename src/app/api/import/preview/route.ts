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

    // Obtener el ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Convertir correctamente → Buffer real compatible con ExcelJS
    const uint8Array = new Uint8Array(arrayBuffer);
    const buffer = Buffer.from(uint8Array.buffer); // 👈 ESTA ES LA CORRECTA

    // Crear workbook y cargar el archivo
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

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
