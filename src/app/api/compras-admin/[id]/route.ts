import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { estatus } = await req.json();
    const compraId = Number(params.id);

    if (!compraId || !estatus) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // Reglas de negocio
    const dataUpdate: any = {
      estatus,
    };

    if (estatus === EstatusCompra.PAGADA) {
      dataUpdate.fechaPago = new Date();
    }

    const compra = await prisma.compraAdministrativa.update({
      where: { id: compraId },
      data: dataUpdate,
    });

    return NextResponse.json({ ok: true, compra });
  } catch (error) {
    console.error("PATCH compras-admin:", error);
    return NextResponse.json(
      { error: "Error al actualizar estatus" },
      { status: 500 }
    );
  }
}
