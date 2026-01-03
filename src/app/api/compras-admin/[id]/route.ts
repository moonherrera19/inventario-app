import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstatusCompra } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { estatus } = await req.json();

    const compraId = Number(id);

    if (!compraId || !estatus) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const dataUpdate: any = {
      estatus,
    };

    // 🔥 Fecha automática solo cuando pasa a PAGADA
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
