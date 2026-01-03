export const runtime = "nodejs"; // 🔴 ESTO ES LA CLAVE

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = body.rows;

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
        const proveedorNombre =
          row.PROVEEDOR || row.PROVEDOR || null;
        const folio = row.FOLIO || null;
        const totalRaw = row.TOTAL || null;

        if (!proveedorNombre || !folio || !totalRaw) {
          ignorados++;
          continue;
        }

        const proveedor = await prisma.proveedor.findFirst({
          where: {
            nombre: {
              equals: String(proveedorNombre).trim(),
              mode: "insensitive",
            },
          },
        });

        if (!proveedor) {
          ignorados++;
          continue;
        }

        const monto = Number(
          String(totalRaw).replace(/[$,]/g, "")
        );

        if (isNaN(monto)) {
          ignorados++;
          continue;
        }

        await prisma.compraAdministrativa.create({
          data: {
            proveedorId: proveedor.id,
            numeroFactura: String(folio),
            concepto: row.PRODUCTO
              ? String(row.PRODUCTO)
              : "SIN CONCEPTO",
            banco: row.BANCO ? String(row.BANCO) : null,
            cuentaClabe: row["CUENTA/CLABE"]
              ? String(row["CUENTA/CLABE"])
              : null,
            empresa: row.EMPRESA ? String(row.EMPRESA) : null,
            moneda: row.MONEDA ? String(row.MONEDA) : "MXN",
            precio: null,
            monto,
            estatus: EstatusCompra.CAPTURADA,
            fechaFactura: null,
            fechaPago: null,
          },
        });

        insertados++;
      } catch (e) {
        console.error("Fila ignorada", row, e);
        ignorados++;
      }
    }

    return NextResponse.json({
      message: "Carga masiva completada",
      insertados,
      ignorados,
    });
  } catch (error) {
    console.error("ERROR GENERAL:", error);
    return NextResponse.json(
      { error: "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}
