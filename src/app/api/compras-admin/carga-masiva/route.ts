export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { rows } = await req.json();

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Formato inválido" },
        { status: 400 }
      );
    }

    let insertados = 0;
    let ignorados = 0;

    for (const row of rows) {
      try {
        const proveedorNombre = String(row.PROVEEDOR || row.PROVEDOR || "").trim();
        const folio = String(row.FOLIO || "").trim();
        const total = String(row.TOTAL || "").replace(/[$,]/g, "");

        if (!proveedorNombre || !folio || !total) {
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

        await prisma.compraAdministrativa.create({
          data: {
            proveedorId: proveedor.id,
            numeroFactura: folio,
            concepto: String(row.PRODUCTO || "SIN CONCEPTO"),
            banco: String(row.BANCO || ""),
            cuentaClabe: String(row["CUENTA/CLABE"] || ""),
            empresa: String(row.EMPRESA || ""),
            moneda: String(row.MONEDA || "MXN"),
            precio: row.PRECIO ? Number(String(row.PRECIO).replace(/[$,]/g, "")) : null,
            monto: Number(total),
            estatus: EstatusCompra.CAPTURADA,
            fechaFactura: row["FECHA EMISION"]
              ? new Date(row["FECHA EMISION"])
              : null,
            fechaPago: row["FECHA DEL PAGO"]
              ? new Date(row["FECHA DEL PAGO"])
              : null,
          },
        });

        insertados++;
      } catch (e) {
        console.error("Fila ignorada:", row, e);
        ignorados++;
      }
    }

    return NextResponse.json({
      message: "Carga masiva completada",
      insertados,
      ignorados,
    });
  } catch (error) {
    console.error("ERROR GLOBAL:", error);
    return NextResponse.json(
      { error: "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}
