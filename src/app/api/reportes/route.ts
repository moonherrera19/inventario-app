import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo") || "diario";

    // Fechas base
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const inicioSemana = new Date(inicioDia);
    inicioSemana.setDate(inicioDia.getDate() - 7);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    let desde;

    switch (tipo) {
      case "diario":
        desde = inicioDia;
        break;
      case "semanal":
        desde = inicioSemana;
        break;
      case "mensual":
        desde = inicioMes;
        break;
      default:
        return NextResponse.json(
          { message: "Tipo de reporte inválido" },
          { status: 400 }
        );
    }

    // ================================================
    // ENTRADAS
    // ================================================
    const entradas = await prisma.entrada.findMany({
      where: { fecha: { gte: desde } },
      include: { producto: true },
      orderBy: { fecha: "desc" },
    });

    // Total Kg/L/pz recibidas
    const totalEntradas = entradas.reduce((sum, e) => sum + e.cantidad, 0);

    // ================================================
    // SALIDAS
    // ================================================
    const salidas = await prisma.salida.findMany({
      where: { fecha: { gte: desde } },
      include: { producto: true },
      orderBy: { fecha: "desc" },
    });

    const totalSalidas = salidas.reduce((sum, s) => sum + s.cantidad, 0);

    // ================================================
    // COMPRAS
    // ================================================
    const compras = await prisma.compra.findMany({
      where: { fecha: { gte: desde } },
      include: { producto: true, proveedor: true },
      orderBy: { fecha: "desc" },
    });

    const totalGasto = compras.reduce((sum, c) => sum + c.costo * c.cantidad, 0);

    // ================================================
    // CONSUMOS POR LOTE
    // ================================================
    const consumos = await prisma.consumo.findMany({
      where: { fecha: { gte: desde } },
      include: { producto: true, lote: true },
      orderBy: { fecha: "desc" },
    });

    const totalConsumos = consumos.reduce((sum, c) => sum + c.cantidad, 0);

    // ================================================
    // RESPUESTA FINAL (PROFESIONAL)
    // ================================================
    return NextResponse.json({
      tipo,
      desde,
      hasta: hoy,

      resumen: {
        totalEntradas,
        totalSalidas,
        totalGasto,
        totalConsumos,
      },

      detalle: {
        entradas,
        salidas,
        compras,
        consumos,
      },
    });
  } catch (error) {
    console.error("❌ Error en Reportes:", error);
    return NextResponse.json(
      { message: "Error generando reporte" },
      { status: 500 }
    );
  }
}
