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

    // 👇 defval evita undefined
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

    let creados = 0;
    let actualizados = 0;

    for (const row of rows) {
      if (!row.NOMBRE) continue;

      const nombre = String(row.NOMBRE).trim();

      const data = {
        nombre,
        telefono: row.TELEFONO ? String(row.TELEFONO) : null,
        direccion: row.DIRECCION ? String(row.DIRECCION) : null,
        rfc: row.RFC ? String(row.RFC) : null,

        // ===== MXN =====
        banco: row.BANCO_MXN ? String(row.BANCO_MXN) : null,
        numeroCuenta: row.CUENTA_MXN ? String(row.CUENTA_MXN) : null,
        clabe: row.CLABE_MXN ? String(row.CLABE_MXN) : null,

        // ===== USD =====
        bancoDolares: row.BANCO_USD ? String(row.BANCO_USD) : null,
        numeroCuentaDolares: row.CUENTA_USD ? String(row.CUENTA_USD) : null,
        clabeDolares: row.CLABE_USD ? String(row.CLABE_USD) : null,
      };

      const existente = await prisma.proveedor.findFirst({
        where: { nombre },
      });

      if (existente) {
        // 🔄 UPDATE
        await prisma.proveedor.update({
          where: { id: existente.id },
          data,
        });
        actualizados++;
      } else {
        // 🆕 CREATE
        await prisma.proveedor.create({ data });
        creados++;
      }
    }

    return NextResponse.json({
      message: "Importación inteligente completada",
      creados,
      actualizados,
    });
  } catch (error) {
    console.error("❌ Error importando proveedores:", error);
    return NextResponse.json(
      { message: "Error al importar proveedores" },
      { status: 500 }
    );
  }
}
