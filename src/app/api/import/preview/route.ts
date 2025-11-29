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

    // Convertimos a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Convertimos a ReadableStream (lo acepta Vercel y ExcelJS)
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(arrayBuffer));
        controller.close();
      },
    });

    const workbook = new ExcelJS.Workbook();

    // ⭐ MÉTODO SEGURO PARA VERCEL
    await workbook.xlsx.read(readable as any);

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
