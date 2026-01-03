export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra, Prisma } from "@prisma/client";

// ============================
// GET
// ============================
export async function GET() {
  try {
    const compras = await prisma.compraAdministrativa.findMany({
      orderBy: { creadoEn: "desc" },
    });

    return NextResponse.json({ compras });
  } catch (error) {
    console.error("GET compras-admin:", error);
    return NextResponse.json({ error: "Error GET" }, { status: 500 });
  }
}

// ============================
// POST – CARGA MASIVA DIRECTA
// ============================
export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "rows no es array" }, { status: 400 });
    }

    let insertados = 0;
    let fallidos = 0;

    for (const row of rows) {
      try {
        const data: Prisma.CompraAdministrativaUncheckedCreateInput = {
          proveedorNombre: String(
            row["PROVEDOR:"] ??
            row["PROVEEDOR"] ??
            ""
          ).trim() || null,

          numeroFactura: String(row["FOLIO"] ?? "").trim() || null,

          concepto: String(row["PRODUCTO"] ?? "SIN CONCEPTO"),

          banco: row["BANCO:"] ? String(row["BANCO:"]) : null,
          cuentaClabe: row["CUENTA/CLABE:"] ? String(row["CUENTA/CLABE:"]) : null,
          empresa: row["EMPRESA:"] ? String(row["EMPRESA:"]) : null,

          moneda: row["MONEDA:"] ? String(row["MONEDA:"]) : "MXN",

          monto: Number(
            String(row["TOTAL:"] ?? row["TOTAL"] ?? "0").replace(/[$,]/g, "")
          ),

          estatus: EstatusCompra.CAPTURADA,
        };

        await prisma.compraAdministrativa.create({ data });
        insertados++;
      } catch (err) {
        console.error("Fila fallida:", row, err);
        fallidos++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      insertados,
      fallidos,
    });
  } catch (error) {
    console.error("POST compras-admin:", error);
    return NextResponse.json(
      { error: "Error POST", detalle: String(error) },
      { status: 500 }
    );
  }
}
//