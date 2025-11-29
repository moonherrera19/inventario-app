import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const runtime = "nodejs"; // 👈 OBLIGATORIO para permitir Buffer en Vercel

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

    // Obtener ArrayBuffer del archivo
    const arrayBuffer = await file.arrayBuffer();

    // Convertir ArrayBuffer → Buffer Node
    const buffer = Buffer.from(arrayBuffer); // 👈 ESTA es la forma correcta

    // Ahora sí cargar workbook
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
