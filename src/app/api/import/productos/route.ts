import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";

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

    // Convertir archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Convertir a ReadableStream compatible con Vercel
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(arrayBuffer));
        controller.close();
      },
    });

    // Leer Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.read(readable as any);

    const sheet = workbook.worksheets[0];
    const productos: any[] = [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // saltar encabezado

      const values = row.values as any[];

      productos.push({
        nombre: values[1] || "",
        categoriaId: Number(values[2]) || null,
        unidad: values[3] || "",
        stock: Number(values[4]) || 0,
      });
    });

    // Inserción masiva
    const inserted = await prisma.producto.createMany({
      data: productos,
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: "Importación completada",
      insertados: inserted.count,
      productos,
    });
  } catch (error) {
    console.error("❌ Error importando productos:", error);
    return NextResponse.json(
      { error: "Error procesando archivo" },
      { status: 500 }
    );
  }
}
