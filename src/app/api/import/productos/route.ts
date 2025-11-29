import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió archivo" },
        { status: 400 }
      );
    }

    // leer buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];

    const productos = [];
    const errores = [];

    sheet.eachRow((row, index) => {
      if (index === 1) return; // saltar encabezado

      const nombre = row.getCell(1).value?.toString().trim();
      const unidad = row.getCell(2).value?.toString().trim();
      const stock = Number(row.getCell(3).value || 0);
      const stockMinimo = Number(row.getCell(4).value || 0);

      if (!nombre || !unidad) {
        errores.push({
          fila: index,
          error: "Nombre o unidad vacíos",
        });
        return;
      }

      productos.push({
        nombre,
        unidad,
        stock,
        stockMinimo,
      });
    });

    if (errores.length > 0) {
      return NextResponse.json({ errores }, { status: 400 });
    }

    // evitar duplicados por nombre
    const nombres = productos.map((p) => p.nombre);
    const existentes = await prisma.producto.findMany({
      where: { nombre: { in: nombres } },
    });

    const duplicados = existentes.map((p) => p.nombre);

    if (duplicados.length > 0) {
      return NextResponse.json(
        { error: "Duplicados detectados", duplicados },
        { status: 400 }
      );
    }

    // insertar en prisma
    await prisma.producto.createMany({
      data: productos,
      skipDuplicates: true,
    });

    return NextResponse.json({ ok: true, insertados: productos.length });
  } catch (err) {
    console.error("Error importando:", err);
    return NextResponse.json(
      { error: "Error interno al importar" },
      { status: 500 }
    );
  }
}
