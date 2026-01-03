import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ===============================
// GET → listar compras
// ===============================
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

// ===============================
// POST → CARGA MASIVA (INSERTA TODO SIN VALIDAR)
// ===============================
export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: "rows no es array" },
        { status: 400 }
      );
    }

    let insertados = 0;
    let ignorados = 0;

    for (const row of rows) {
      try {
        await prisma.compraAdministrativa.create({
          data: {
            // 🔥 CLAVE PARA QUE COMPILE
            proveedorId: 1,

            proveedorNombre: String(
              row["PROVEDOR:"] ??
              row["PROVEEDOR"] ??
              ""
            ).trim() || null,

            numeroFactura: String(row["FOLIO"] ?? "").trim() || null,

            concepto: String(row["PRODUCTO"] ?? "SIN CONCEPTO"),

            banco: row["BANCO:"] ? String(row["BANCO:"]) : null,

            cuentaClabe: row["CUENTA/CLABE:"]
              ? String(row["CUENTA/CLABE:"])
              : null,

            empresa: row["EMPRESA:"]
              ? String(row["EMPRESA:"])
              : null,

            moneda: row["MONEDA:"]
              ? String(row["MONEDA:"])
              : "MXN",

            monto: Number(
              String(row["TOTAL:"] ?? row["TOTAL"] ?? 0)
                .replace(/[$,]/g, "")
            ),

            estatus: EstatusCompra.CAPTURADA,
          },
        });

        insertados++;
      } catch (err) {
        console.error("Fila fallida:", row, err);
        ignorados++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      insertados,
      ignorados,
    });
  } catch (error) {
    console.error("POST compras-admin:", error);
    return NextResponse.json(
      { error: "Error POST", detalle: String(error) },
      { status: 500 }
    );
  }
}
