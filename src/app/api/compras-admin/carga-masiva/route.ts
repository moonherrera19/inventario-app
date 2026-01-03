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
        const proveedorNombre = row.PROVEEDOR || row.PROVEDOR;
        const folio = row.FOLIO;
        const total = row.TOTAL;

        if (!proveedorNombre || !folio || !total) {
          ignorados++;
          continue;
        }

        const proveedor = await prisma.proveedor.findFirst({
          where: {
            nombre: {
              equals: proveedorNombre.toString().trim(),
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
            numeroFactura: folio.toString(),
            concepto: row.PRODUCTO || "SIN CONCEPTO",
            banco: row.BANCO || null,
            cuentaClabe: row["CUENTA/CLABE"] || null,
            empresa: row.EMPRESA || null,
            moneda: row.MONEDA || "MXN",
            precio: row.PRECIO ? Number(row.PRECIO) : null,
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
      } catch (err) {
        console.error("Fila ignorada:", row, err);
        ignorados++;
      }
    }

    return NextResponse.json({
      message: "Carga masiva completada",
      insertados,
      ignorados,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}
