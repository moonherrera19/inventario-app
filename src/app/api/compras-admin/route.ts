export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

// ======================================================
// GET → listar compras (SIN CACHE)
// ======================================================
export async function GET() {
  try {
    const compras = await prisma.compraAdministrativa.findMany({
      include: { proveedor: true },
      orderBy: { creadoEn: "desc" },
    });

    const totales = await prisma.compraAdministrativa.groupBy({
      by: ["estatus"],
      _sum: { monto: true },
    });

    return NextResponse.json(
      { compras, totales },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET compras-admin:", error);
    return NextResponse.json({ error: "Error GET" }, { status: 500 });
  }
}

// ======================================================
// POST → CARGA MASIVA DESDE EXCEL (JSON rows)
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = body.rows;

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { ok: false, message: "rows no es un array" },
        { status: 400 }
      );
    }

    let insertados = 0;
    let ignorados = 0;

    for (const row of rows) {
      try {
        // 🔑 CAMPOS EXACTOS DE TU EXCEL
        const proveedorNombre = String(
          row["PROVEDOR:"] ??
          row["PROVEEDOR"] ??
          ""
        ).trim();

        const folio = String(row["FOLIO"] ?? "").trim();

        const totalRaw = String(
          row["TOTAL:"] ??
          row["TOTAL"] ??
          ""
        ).replace(/[$,]/g, "");

        if (!proveedorNombre || !folio || !totalRaw) {
          ignorados++;
          continue;
        }

        const proveedor = await prisma.proveedor.findFirst({
          where: {
            nombre: {
              equals: proveedorNombre,
              mode: "insensitive",
            },
          },
        });

        if (!proveedor) {
          ignorados++;
          continue;
        }

        const monto = Number(totalRaw);
        if (isNaN(monto)) {
          ignorados++;
          continue;
        }

        const estatusTexto = String(
          row["ESTATUS"] ?? "CAPTURADA"
        ).toUpperCase();

        const estatus: EstatusCompra =
          estatusTexto === "PAGADA"
            ? EstatusCompra.PAGADA
            : estatusTexto === "APROBADA"
            ? EstatusCompra.APROBADA
            : EstatusCompra.CAPTURADA;

        await prisma.compraAdministrativa.create({
          data: {
            proveedorId: proveedor.id,
            numeroFactura: folio,
            concepto: String(row["PRODUCTO"] ?? "SIN CONCEPTO"),
            banco: row["BANCO:"] ? String(row["BANCO:"]) : null,
            cuentaClabe: row["CUENTA/CLABE:"] ? String(row["CUENTA/CLABE:"]) : null,
            empresa: row["EMPRESA:"] ? String(row["EMPRESA:"]) : null,
            moneda: row["MONEDA:"] ? String(row["MONEDA:"]) : "MXN",
            monto,
            estatus,
          },
        });

        insertados++;
      } catch (err) {
        console.error("Fila fallida:", row, err);
        ignorados++;
      }
    }

    // 🔥 RESPUESTA QUE EL MODAL ENTIENDE
    return NextResponse.json({
      ok: true,
      message: "Carga masiva completada",
      resumen: {
        totalFilas: rows.length,
        insertados,
        ignorados,
      },
    });
  } catch (error) {
    console.error("POST compras-admin:", error);
    return NextResponse.json(
      { ok: false, message: "Error POST", detalle: String(error) },
      { status: 500 }
    );
  }
}
