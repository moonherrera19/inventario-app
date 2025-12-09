export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearPDFBase } from "@/lib/pdf/basePDF";
import { rgb } from "pdf-lib";

// ======================================================
// GET — Reporte PDF de Salidas
// ======================================================
export async function GET() {
  try {
    const salidas = await prisma.salida.findMany({
      orderBy: { fecha: "desc" },
      include: { producto: true },
    });

    // BASE PDF
    const { pdfDoc, page, width, height, font } = await crearPDFBase();
    let currentPage = page;
    let y = height - 130;

    // TÍTULO
    currentPage.drawText("REPORTE DE SALIDAS", {
      x: 20,
      y,
      size: 18,
      font,
      color: rgb(0, 0.45, 0.2),
    });

    y -= 35;

    // ENCABEZADOS
    currentPage.drawText("Fecha", { x: 20, y, size: 12, font });
    currentPage.drawText("Producto", { x: 120, y, size: 12, font });
    currentPage.drawText("Rancho", { x: 280, y, size: 12, font });
    currentPage.drawText("Cultivo", { x: 380, y, size: 12, font });
    currentPage.drawText("Salida", { x: 480, y, size: 12, font });

    y -= 15;

    currentPage.drawLine({
      start: { x: 20, y },
      end: { x: width - 20, y },
      thickness: 1,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 20;

    // FILAS
    for (const s of salidas) {
      if (y < 70) {
        currentPage = pdfDoc.addPage([595.28, 841.89]);
        y = 800;

        currentPage.drawText("Fecha", { x: 20, y, size: 12, font });
        currentPage.drawText("Producto", { x: 120, y, size: 12, font });
        currentPage.drawText("Rancho", { x: 280, y, size: 12, font });
        currentPage.drawText("Cultivo", { x: 380, y, size: 12, font });
        currentPage.drawText("Salida", { x: 480, y, size: 12, font });

        y -= 20;
      }

      currentPage.drawText(
        s.fecha.toISOString().slice(0, 10),
        { x: 20, y, size: 12, font }
      );

      currentPage.drawText(
        s.producto.nombre,
        { x: 120, y, size: 12, font }
      );

      currentPage.drawText(
        s.rancho || "-",
        { x: 280, y, size: 12, font }
      );

      currentPage.drawText(
        s.cultivo || "-",
        { x: 380, y, size: 12, font }
      );

      currentPage.drawText(
        String(s.cantidad),
        { x: 480, y, size: 12, font }
      );

      y -= 18;
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=reporte_salidas.pdf",
      },
    });

  } catch (error) {
    console.error("❌ ERROR PDF SALIDAS:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — Crear nueva salida
// ======================================================
export async function POST(req: Request) {
  try {
    const { productoId, cantidad, rancho, cultivo } = await req.json();

    if (!productoId || !cantidad)
      return NextResponse.json({ error: "Producto y cantidad obligatorios" }, { status: 400 });

    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    });

    if (!producto)
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

    if (cantidad <= 0)
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });

    if (producto.stock < cantidad)
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${producto.stock}` },
        { status: 400 }
      );

    // Crear salida
    const salida = await prisma.salida.create({
      data: {
        productoId,
        cantidad,
        rancho: rancho ?? null,
        cultivo: cultivo ?? null,
      },
    });

    // Actualizar stock
    await prisma.producto.update({
      where: { id: productoId },
      data: { stock: producto.stock - cantidad },
    });

    return NextResponse.json(salida);

  } catch (error) {
    console.error("❌ ERROR POST SALIDAS:", error);
    return NextResponse.json({ error: "Error creando salida" }, { status: 500 });
  }
}

// ======================================================
// PUT — Editar salida existente
// ======================================================
export async function PUT(req: Request) {
  try {
    const { id, cantidad, rancho, cultivo } = await req.json();

    if (!id)
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 });

    const original = await prisma.salida.findUnique({ where: { id } });

    if (!original)
      return NextResponse.json({ error: "Salida no encontrada" }, { status: 404 });

    const producto = await prisma.producto.findUnique({
      where: { id: original.productoId },
    });

    if (!producto)
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

    // Recalcular stock
    const stockRecalculado =
      producto.stock + original.cantidad - cantidad;

    if (stockRecalculado < 0)
      return NextResponse.json(
        { error: `Stock insuficiente después del ajuste. Disponible: ${producto.stock}` },
        { status: 400 }
      );

    // Actualizar salida
    const salida = await prisma.salida.update({
      where: { id },
      data: {
        cantidad,
        rancho: rancho ?? null,
        cultivo: cultivo ?? null,
      },
    });

    // Actualizar stock real
    await prisma.producto.update({
      where: { id: producto.id },
      data: { stock: stockRecalculado },
    });

    return NextResponse.json(salida);

  } catch (error) {
    console.error("❌ ERROR PUT SALIDAS:", error);
    return NextResponse.json({ error: "Error actualizando salida" }, { status: 500 });
  }
}
