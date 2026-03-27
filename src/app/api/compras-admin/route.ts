import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ===============================
// GET → listar compras (INCLUYE PROVEEDOR)
// ===============================
export async function GET() {
  try {
    const compras = await prisma.compraAdministrativa.findMany({
      include: {
        proveedor: true,
      },
      orderBy: { creadoEn: "desc" },
    });

    return NextResponse.json({ compras });
  } catch (error) {
    console.error("GET compras-admin:", error);
    return NextResponse.json({ error: "Error GET" }, { status: 500 });
  }
}

// ===============================
// POST → CARGA MASIVA CORREGIDA
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
        // 🔎 detectar columna PRODUCTO (flexible)
        const productoKey = Object.keys(row).find((key) =>
          key.toUpperCase().includes("PRODUCTO")
        );

        // 🔥 LIMPIAR NOMBRE PROVEEDOR
        const nombreProveedor = String(
          row["PROVEDOR:"] ??
          row["PROVEEDOR"] ??
          ""
        ).trim();

        if (!nombreProveedor) {
          console.warn("Fila sin proveedor:", row);
          ignorados++;
          continue;
        }

        // 🔥 CREAR O REUTILIZAR PROVEEDOR
        const proveedor = await prisma.proveedor.upsert({
          where: {
            nombre: nombreProveedor,
          },
          update: {},
          create: {
            nombre: nombreProveedor,
          },
        });

        // 🔥 LIMPIEZA DE MONTO
        const monto = Number(
          String(row["TOTAL:"] ?? row["TOTAL"] ?? 0)
            .replace(/[$,]/g, "")
        );

        // 🔥 LIMPIEZA DE ESTATUS
        const estatusTexto = String(
          row["ESTATUS"] ??
          row["STATUS"] ??
          row["ESTADO"] ??
          ""
        ).toUpperCase();

        const estatus =
          estatusTexto === "PAGADA"
            ? EstatusCompra.PAGADA
            : estatusTexto === "APROBADA"
            ? EstatusCompra.APROBADA
            : EstatusCompra.CAPTURADA;

        // 🔥 CREAR REGISTRO
        await prisma.compraAdministrativa.create({
          data: {
            proveedorId: proveedor.id,
            proveedorNombre: nombreProveedor,

            numeroFactura: String(row["FOLIO"] ?? "").trim() || null,

            concepto: productoKey
              ? String(row[productoKey]).trim() || "SIN CONCEPTO"
              : "SIN CONCEPTO",

            banco: row["BANCO:"] ? String(row["BANCO:"]).trim() : null,

            cuentaClabe: row["CUENTA/CLABE:"]
              ? String(row["CUENTA/CLABE:"]).trim()
              : null,

            empresa: row["EMPRESA:"]
              ? String(row["EMPRESA:"]).trim()
              : null,

            moneda: row["MONEDA:"]
              ? String(row["MONEDA:"]).trim()
              : "MXN",

            monto: isNaN(monto) ? 0 : monto,

            estatus,

            fechaPago:
              estatus === EstatusCompra.PAGADA
                ? new Date()
                : null,
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