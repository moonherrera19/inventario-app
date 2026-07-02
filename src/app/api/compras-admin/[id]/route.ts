import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const {
      estatus,
      fechaPago,
    } = await req.json();

    const compraId = Number(id);

    if (!compraId) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const dataUpdate: any = {};

    // 🔥 actualizar estatus
    if (estatus) {
      dataUpdate.estatus = estatus;
    }

    // 🔥 fecha manual enviada desde frontend
    if (fechaPago !== undefined) {
      dataUpdate.fechaPago = fechaPago
        ? new Date(fechaPago)
        : null;
    }

    // 🔥 si pasa a PAGADA y NO mandan fecha
    if (
      estatus === EstatusCompra.PAGADA &&
      fechaPago === undefined
    ) {
      dataUpdate.fechaPago = new Date();
    }

    const compra =
      await prisma.compraAdministrativa.update({
        where: {
          id: compraId,
        },
        data: dataUpdate,
      });

    return NextResponse.json({
      ok: true,
      compra,
    });
  } catch (error) {
    console.error("PATCH compras-admin:", error);

    return NextResponse.json(
      {
        error: "Error al actualizar compra",
      },
      { status: 500 }
    );
  }
}