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
        // ============================
        // VALIDACIONES MÍNIMAS
        // ============================
        const proveedorNombre =
          row.PROVEEDOR || row.PROVEDOR || null;
        const folio = row.FOLIO || null;
        const totalRaw = row.TOTAL || null;

        if (!proveedorNombre || !folio || !totalRaw) {
          ignorados++;
          continue;
        }

        // ============================
        // BUSCAR PROVEEDOR
        // ============================
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

        // ============================
        // MONTO (ÚNICO NÚMERO)
        // ============================
        const monto = Number(
          String(totalRaw).replace(/[$,]/g, "")
        );

        if (isNaN(monto)) {
          ignorados++;
          continue;
        }

        // ============================
        // CREATE (TODO STRING / NULL)
        // ============================
        await prisma.compraAdministrativa.create({
          data: {
            proveedorId: proveedor.id,

            numeroFactura: String(folio),

            concepto: row.PRODUCTO
              ? String(row.PRODUCTO)
              : "SIN CONCEPTO",

            banco: row.BANCO
              ? String(row.BANCO)
              : null,

            cuentaClabe: row["CUENTA/CLABE"]
              ? String(row["CUENTA/CLABE"])
              : null,

            empresa: row.EMPRESA
              ? String(row.EMPRESA)
              : null,

            moneda: row.MONEDA
              ? String(row.MONEDA)
              : "MXN",

            // ❌ NO convertir precio
            precio: null,

            // ✅ SOLO MONTO NUMÉRICO
            monto,

            estatus: EstatusCompra.CAPTURADA,

            // ❌ NO fechas
            fechaFactura: null,
            fechaPago: null,
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
    console.error("Error general:", error);
    return NextResponse.json(
      { error: "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}
