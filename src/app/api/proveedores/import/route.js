import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Archivo no encontrado" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    let creados = 0;

    for (const row of rows) {
      if (!row.NOMBRE) continue;

      await prisma.proveedor.create({
        data: {
          nombre: String(row.NOMBRE).trim(),
          telefono: row.TELEFONO?.toString() || null,
          correo: row.CORREO || null,
          direccion: row.DIRECCION || null,
          rfc: row.RFC || null,

          banco: row.BANCO_MXN || null,
          numeroCuenta: row.CUENTA_MXN || null,
          clabe: row.CLABE_MXN || null,

          bancoDolares: row.BANCO_USD || null,
          numeroCuentaDolares: row.CUENTA_USD || null,
          clabeDolares: row.CLABE_USD || null,
        },
      });

      creados++;
    }

    return NextResponse.json({
      message: "Importación completada",
      proveedoresCreados: creados,
    });
  } catch (error) {
    console.error("❌ Error importando proveedores:", error);
    return NextResponse.json(
      { message: "Error al importar proveedores" },
      { status: 500 }
    );
  }
}
