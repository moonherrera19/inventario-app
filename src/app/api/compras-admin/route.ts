import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";
import * as XLSX from "xlsx";

/**
 * ⛔ MUY IMPORTANTE
 * Evita cacheo en App Router (Vercel / producción)
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ======================================================
// GET → listar compras + totales
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estatusParam = searchParams.get("estatus");

    const where = estatusParam
      ? { estatus: estatusParam as EstatusCompra }
      : {};

    const compras = await prisma.compraAdministrativa.findMany({
      where,
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
    console.error(error);
    return NextResponse.json(
      { error: "Error al obtener compras administrativas" },
      { status: 500 }
    );
  }
}

// ======================================================
// POST → crear compra manual O importar Excel
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // ==================================================
    // 🔹 IMPORTAR EXCEL DESDE MODAL (JSON rows)
    // ==================================================
    if (contentType.includes("application/json")) {
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
          const proveedorNombre =
            row.PROVEEDOR || row.PROVEDOR || row.proveedor;

          if (!proveedorNombre || !row.FOLIO || !row.TOTAL) {
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

          const monto = Number(
            row.TOTAL.toString().replace(/[$,]/g, "")
          );

          const precio = row.PRECIO
            ? Number(row.PRECIO.toString().replace(/[$,]/g, ""))
            : null;

          const fechaFactura = row["FECHA EMISION"]
            ? new Date(row["FECHA EMISION"])
            : null;

          const fechaPago = row["FECHA DEL PAGO"]
            ? new Date(row["FECHA DEL PAGO"])
            : null;

          await prisma.compraAdministrativa.create({
            data: {
              proveedorId: proveedor.id,
              numeroFactura: row.FOLIO.toString(),
              banco: row.BANCO || null,
              cuentaClabe: row["CUENTA/CLABE"] || null,
              empresa: row.EMPRESA || null,
              moneda: row.MONEDA || "MXN",
              concepto: row.PRODUCTO || "SIN CONCEPTO",
              precio,
              monto,
              fechaFactura,
              fechaPago,
              estatus: EstatusCompra.CAPTURADA,
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
    }

    // ==================================================
    // 🔹 CREAR FACTURA MANUAL
    // ==================================================
    const body = await req.json();

    const compra = await prisma.compraAdministrativa.create({
      data: {
        proveedorId: body.proveedorId,
        usuarioId: body.usuarioId || null,
        numeroFactura: body.numeroFactura || null,
        banco: body.banco || null,
        cuentaClabe: body.cuentaClabe || null,
        empresa: body.empresa || null,
        moneda: body.moneda || "MXN",
        concepto: body.concepto,
        precio: body.precio ?? null,
        monto: Number(body.monto),
        fechaFactura: body.fechaFactura
          ? new Date(body.fechaFactura)
          : null,
        estatus: EstatusCompra.CAPTURADA,
        observaciones: body.observaciones || null,
      },
    });

    return NextResponse.json(compra);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// ======================================================
// PATCH → cambiar estatus
// ======================================================
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const nuevoEstatus = body.estatus as EstatusCompra;

    const compra = await prisma.compraAdministrativa.update({
      where: { id: Number(id) },
      data: {
        estatus: nuevoEstatus,
        fechaPago:
          nuevoEstatus === EstatusCompra.PAGADA
            ? new Date(body.fechaPago || new Date())
            : null,
      },
    });

    return NextResponse.json(compra);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al actualizar estatus" },
      { status: 500 }
    );
  }
}
