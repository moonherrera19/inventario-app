export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

// ======================================================
// GET → listar compras + totales (SIN CACHE)
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
    return NextResponse.json(
      { error: "Error al obtener compras administrativas" },
      { status: 500 }
    );
  }
}

// ======================================================
// POST → carga masiva (JSON rows) O alta manual
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // ==================================================
    // 🔹 CARGA MASIVA DESDE EXCEL (JSON)
// ==================================================
    if (contentType.includes("application/json")) {
      const { rows } = await req.json();

      if (!Array.isArray(rows)) {
        return NextResponse.json(
          { error: "Formato inválido, rows no es array" },
          { status: 400 }
        );
      }

      let insertados = 0;
      let ignorados = 0;

      for (const row of rows) {
        try {
          // 🔑 LECTURA EXACTA DE TU EXCEL
          const proveedorNombre = String(
            row["PROVEDOR:"] || ""
          ).trim();

          const folio = String(row["FOLIO"] || "").trim();
          const totalRaw = String(row["TOTAL:"] || "").replace(/[$,]/g, "");

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

          const precio = row["PRECIO"]
            ? Number(String(row["PRECIO"]).replace(/[$,]/g, ""))
            : null;

          const fechaFactura = row["FECHA EMISION"]
            ? new Date(row["FECHA EMISION"])
            : null;

          const fechaPago = row["FECHA DEL PAGO"]
            ? new Date(row["FECHA DEL PAGO"])
            : null;

          const estatusExcel = String(row["ESTATUS"] || "CAPTURADA").toUpperCase();
          const estatus: EstatusCompra =
            estatusExcel === "PAGADA"
              ? EstatusCompra.PAGADA
              : estatusExcel === "APROBADA"
              ? EstatusCompra.APROBADA
              : EstatusCompra.CAPTURADA;

          await prisma.compraAdministrativa.create({
            data: {
              proveedorId: proveedor.id,
              numeroFactura: folio,
              concepto: String(row["PRODUCTO"] || "SIN CONCEPTO"),
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
              precio,
              monto,
              fechaFactura,
              fechaPago,
              estatus,
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
    // 🔹 ALTA MANUAL
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
    console.error("POST compras-admin:", error);
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
    console.error("PATCH compras-admin:", error);
    return NextResponse.json(
      { error: "Error al actualizar estatus" },
      { status: 500 }
    );
  }
}
