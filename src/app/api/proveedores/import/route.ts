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
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

    let creados = 0;
    let duplicados = 0;

    for (const row of rows) {
      if (!row.NOMBRE) continue;

      const nombre = String(row.NOMBRE).trim();

      // 🔒 Evitar duplicados por nombre
      const existe = await prisma.proveedor.findFirst({
        where: { nombre },
      });

      if (existe) {
        duplicados++;
        continue;
      }

      await prisma.proveedor.create({
        data: {
          nombre,

          // ===== DATOS GENERALES =====
          telefono: row.TELEFONO?.toString() || null,
          direccion: row.DIRECCION || null,
          rfc: row.RFC || null,

          // ===== MXN =====
          banco: row.BANCO_MXN || null,
          numeroCuenta: row.CUENTA_MXN?.toString() || null,
          clabe: row.CLABE_MXN?.toString() || null,

          // ===== USD (OPCIONAL) =====
          bancoDolares: row.BANCO_USD || null,
          numeroCuentaDolares: row.CUENTA_USD?.toString() || null,
          clabeDolares: row.CLABE_USD?.toString() || null,
        },
      });

      creados++;
    }

    return NextResponse.json({
      message: "Importación finalizada correctamente",
      creados,
      duplicados,
    });
  } catch (error) {
    console.error("❌ Error importando proveedores:", error);
    return NextResponse.json(
      { message: "Error al importar proveedores" },
      { status: 500 }
    );
  }
}
