import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";
import * as XLSX from "xlsx";

// ======================================================
// GET → listar compras + filtros + totales
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

    return NextResponse.json({ compras, totales });
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
    // 🔹 IMPORTAR EXCEL (FORMATO HUMANO)
    // ==================================================
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "Archivo no encontrado" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);

      let inserted = 0;
      let skipped = 0;

      for (const row of rows) {
        const proveedorNombre = row.PROVEEDOR || row.PROVEDOR;
        if (!proveedorNombre || !row.TOTAL || !row.FOLIO) {
          skipped++;
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
          skipped++;
          continue;
        }

        // 💲 limpiar montos ($ ,)
        const monto = Number(
          row.TOTAL.toString().replace(/[$,]/g, "")
        );

        const precio = row.PRECIO
          ? Number(row.PRECIO.toString().replace(/[$,]/g, ""))
          : null;

        // 📅 fechas
        const fechaFactura = row["FECHA EMISION"]
          ? new Date(row["FECHA EMISION"])
          : null;

        const fechaPago = row["FECHA DEL PAGO"]
          ? new Date(row["FECHA DEL PAGO"])
          : null;

        // 🧾 estatus
        const estatusExcel = row.ESTATUS?.toString().toUpperCase();
        const estatus: EstatusCompra =
          estatusExcel === "PAGADA"
            ? EstatusCompra.PAGADA
            : estatusExcel === "APROBADA"
            ? EstatusCompra.APROBADA
            : EstatusCompra.CAPTURADA;

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
            fechaPago: estatus === EstatusCompra.PAGADA ? fechaPago : null,
            estatus,
          },
        });

        inserted++;
      }

      return NextResponse.json({
        message: "Importación completada",
        registrosInsertados: inserted,
        registrosIgnorados: skipped,
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
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
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
