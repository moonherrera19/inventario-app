import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        if (!row.FOLIO || !row.TOTAL || !row.PROVEEDOR) {
          skipped++;
          continue;
        }

        // 🔹 PROVEEDOR (crear si no existe)
        const proveedorNombre = row.PROVEEDOR.toString().trim();

        let proveedor = await prisma.proveedor.findFirst({
          where: {
            nombre: {
              equals: proveedorNombre,
              mode: "insensitive",
            },
          },
        });

        if (!proveedor) {
          proveedor = await prisma.proveedor.create({
            data: { nombre: proveedorNombre },
          });
        }

        await prisma.compraAdministrativa.create({
          data: {
            proveedorId: proveedor.id,
            numeroFactura: row.FOLIO.toString(),
            concepto: row.PRODUCTO || "SIN CONCEPTO",
            monto: Number(row.TOTAL.toString().replace(/[$,]/g, "")),
            banco: row.BANCO || null,
            cuentaClabe: row["CUENTA/CLABE"] || null,
            empresa: row.EMPRESA || null,
            moneda: row.MONEDA || "MXN",
            precio: row.PRECIO
              ? Number(row.PRECIO.toString().replace(/[$,]/g, ""))
              : null,
            fechaFactura: row["FECHA EMISION"]
              ? new Date(row["FECHA EMISION"])
              : null,
            fechaPago: null,
            estatus: EstatusCompra.CAPTURADA, // 🔒 FORZADO
          },
        });

        inserted++;
      } catch (err) {
        console.error("Fila ignorada:", row, err);
        skipped++;
      }
    }

    return NextResponse.json({
      ok: true,
      registrosInsertados: inserted,
      registrosIgnorados: skipped,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error en carga masiva" },
      { status: 500 }
    );
  }
}
