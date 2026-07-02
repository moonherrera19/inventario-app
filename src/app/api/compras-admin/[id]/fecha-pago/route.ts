// app/api/compras-admin/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Next.js 15+: params es una Promise, siempre await
    const { id } = await context.params;
    const compraId = parseInt(id);

    if (isNaN(compraId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { estatus, fechaPago } = body;

    // Objeto dinámico de actualización
    const dataToUpdate: Record<string, unknown> = {};

    // ── Cambio de estatus ──
    if (estatus) {
      dataToUpdate.estatus = estatus;

      // Si se marca PAGADA y no viene fechaPago explícita, asignamos hoy
      if (estatus === "PAGADA" && fechaPago === undefined) {
        dataToUpdate.fechaPago = new Date();
      }
    }

    // ── Actualización de fechaPago (funciona en CUALQUIER estatus) ──
    // Viene cuando el usuario edita el input date directamente en la tabla
    if (fechaPago !== undefined) {
      // Si viene string vacío o null, limpiamos la fecha
      dataToUpdate.fechaPago = fechaPago ? new Date(fechaPago) : null;
    }

    // Si no hay nada que actualizar, error
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "No se enviaron campos para actualizar" },
        { status: 400 }
      );
    }

    const compraActualizada = await prisma.compra.update({
      where: { id: compraId },
      data: dataToUpdate,
    });

    return NextResponse.json({ ok: true, compra: compraActualizada });
  } catch (error) {
    console.error("Error PATCH compra:", error);
    return NextResponse.json(
      { error: "Error actualizando compra" },
      { status: 500 }
    );
  }
}