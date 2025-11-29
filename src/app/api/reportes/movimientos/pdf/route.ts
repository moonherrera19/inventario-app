// app/api/reportes/movimientos/pdf/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearPDFBase } from "@/lib/pdf/basePDF";
import { rgb } from "pdf-lib";

export async function GET() {
  try {
    // Obtener todos los movimientos
    const entradas = await prisma.entrada.findMany({
      include: { producto: true },
      orderBy: { fecha: "desc" }
    });

    const salidas = await prisma.salida.findMany({
      include: { producto: true },
      orderBy: { fecha: "desc" }
    });

    const compras = await prisma.compra.findMany({
      include: { producto: true, proveedor: true },
      orderBy: { fecha: "desc" }
    });

    const consumos = await prisma.consumo.findMany({
      include: { producto: true, lote: true },
      orderBy: { fecha: "desc" }
    });

    const { pdfDoc, page, width, height, font } = await crearPDFBase();
    let y = height - 120;

    // --------------------------------------------------------
    // TÍTULO PRINCIPAL
    // --------------------------------------------------------
    page.drawText("REPORTE GENERAL DE MOVIMIENTOS", {
      x: 20,
      y,
      size: 18,
      font,
      color: rgb(0, 0.5, 0.2),
    });

    y -= 40;


    // --------------------------------------------------------
    // SECCIÓN: ENTRADAS
    // --------------------------------------------------------
    page.drawText("ENTRADAS DE INVENTARIO", {
      x: 20,
      y,
      size: 16,
      font,
      color: rgb(0, 0.4, 0.2),
    });

    y -= 25;

    if (entradas.length === 0) {
      page.drawText("No hay entradas registradas.", {
        x: 20,
        y,
        size: 12,
        font,
      });
      y -= 30;
    } else {
      // Encabezado
      page.drawText("Fecha", { x: 20, y, size: 12, font });
      page.drawText("Producto", { x: 120, y, size: 12, font });
      page.drawText("Cantidad", { x: 260, y, size: 12, font });

      y -= 18;

      entradas.forEach((ent) => {
        page.drawText(ent.fecha.toISOString().substring(0, 10), {
          x: 20,
          y,
          size: 12,
          font,
        });

        page.drawText(ent.producto.nombre, {
          x: 120,
          y,
          size: 12,
          font,
        });

        page.drawText(`${ent.cantidad}`, {
          x: 260,
          y,
          size: 12,
          font,
        });

        y -= 18;

        // Nueva página
        if (y < 80) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = 800;
        }
      });

      y -= 30;
    }


    // --------------------------------------------------------
    // SECCIÓN: SALIDAS
    // --------------------------------------------------------
    page.drawText("SALIDAS", {
      x: 20,
      y,
      size: 16,
      font,
      color: rgb(0.4, 0.2, 0.2),
    });

    y -= 25;

    if (salidas.length === 0) {
      page.drawText("No hay salidas registradas.", {
        x: 20,
        y,
        size: 12,
        font,
      });
      y -= 30;
    } else {
      page.drawText("Fecha", { x: 20, y, size: 12, font });
      page.drawText("Producto", { x: 120, y, size: 12, font });
      page.drawText("Cantidad", { x: 260, y, size: 12, font });

      y -= 18;

      salidas.forEach((sal) => {
        page.drawText(sal.fecha.toISOString().substring(0, 10), {
          x: 20,
          y,
          size: 12,
          font,
        });

        page.drawText(sal.producto.nombre, {
          x: 120,
          y,
          size: 12,
          font,
        });

        page.drawText(`${sal.cantidad}`, {
          x: 260,
          y,
          size: 12,
          font,
        });

        y -= 18;

        if (y < 80) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = 800;
        }
      });

      y -= 30;
    }


    // --------------------------------------------------------
    // SECCIÓN: COMPRAS
    // --------------------------------------------------------
    page.drawText("COMPRAS", {
      x: 20,
      y,
      size: 16,
      font,
      color: rgb(0.1, 0.2, 0.6),
    });

    y -= 25;

    if (compras.length === 0) {
      page.drawText("No hay compras registradas.", {
        x: 20,
        y,
        size: 12,
        font,
      });
      y -= 30;
    } else {
      page.drawText("Fecha", { x: 20, y, size: 12, font });
      page.drawText("Producto", { x: 120, y, size: 12, font });
      page.drawText("Proveedor", { x: 260, y, size: 12, font });
      page.drawText("Costo", { x: 390, y, size: 12, font });

      y -= 18;

      compras.forEach((comp) => {
        const fecha = comp.fecha.toISOString().substring(0, 10);

        page.drawText(fecha, { x: 20, y, size: 12, font });
        page.drawText(comp.producto.nombre, { x: 120, y, size: 12, font });
        page.drawText(comp.proveedor.nombre, { x: 260, y, size: 12, font });
        page.drawText(`$${comp.costo}`, { x: 390, y, size: 12, font });

        y -= 18;

        if (y < 80) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = 800;
        }
      });

      y -= 30;
    }


    // --------------------------------------------------------
    // SECCIÓN: CONSUMOS
    // --------------------------------------------------------
    page.drawText("CONSUMOS POR LOTE", {
      x: 20,
      y,
      size: 16,
      font,
      color: rgb(0.2, 0.5, 0.1),
    });

    y -= 25;

    if (consumos.length === 0) {
      page.drawText("No hay consumos registrados.", {
        x: 20,
        y,
        size: 12,
        font,
      });
    } else {
      page.drawText("Fecha", { x: 20, y, size: 12, font });
      page.drawText("Producto", { x: 120, y, size: 12, font });
      page.drawText("Lote", { x: 260, y, size: 12, font });
      page.drawText("Cantidad", { x: 370, y, size: 12, font });

      y -= 18;

      consumos.forEach((cons) => {
        page.drawText(cons.fecha.toISOString().substring(0, 10), {
          x: 20,
          y,
          size: 12,
          font,
        });

        page.drawText(cons.producto.nombre, {
          x: 120,
          y,
          size: 12,
          font,
        });

        page.drawText(cons.lote.nombre, {
          x: 260,
          y,
          size: 12,
          font,
        });

        page.drawText(`${cons.cantidad}`, {
          x: 370,
          y,
          size: 12,
          font,
        });

        y -= 18;

        if (y < 80) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = 800;
        }
      });
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte_movimientos.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ Error PDF movimientos:", error);
    return NextResponse.json(
      { error: "Error generando PDF" },
      { status: 500 }
    );
  }
}
