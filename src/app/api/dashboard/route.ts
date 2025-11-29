import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// SUMA segura
const sum = (arr: any[], field: string) =>
  arr.reduce((a, b) => a + Number(b[field] || 0), 0);

export async function GET() {
  // ------------------ Totales ------------------
  const productos = await prisma.producto.findMany();
  const entradas = await prisma.entrada.findMany();
  const salidas = await prisma.salida.findMany();
  const compras = await prisma.compra.findMany();
  const consumos = await prisma.consumo.findMany();

  // Consumo del día
  const hoy = new Date().toISOString().split("T")[0];
  const consumoDia = consumos.filter(
    (c) => c.fecha.toISOString().split("T")[0] === hoy
  ).length;

  // Compras de la semana
  const hace7 = new Date(Date.now() - 7 * 86400000);
  const comprasSemana = compras
    .filter((c: any) => c.fecha >= hace7)
    .reduce((a, b) => a + b.costo * b.cantidad, 0);

  // Stock bajo
  const stockBajo = productos.filter(
    (p) => p.stockMinimo > 0 && p.stock <= p.stockMinimo
  );

  // ------------------ Gráfica Donut ------------------
  const categorias = await prisma.categoria.findMany({
    include: { productos: true },
  });

  const donutLabels = categorias.map((c) => c.nombre);
  const donutValues = categorias.map((c) => c.productos.length);

  // ------------------ Gráfica de Barras (Consumos x día) ------------------
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const barValues = dias.map((d) => Math.floor(Math.random() * 10)); // simulación

  return NextResponse.json({
    totales: {
      productos: productos.length,
      stock: sum(productos, "stock"),
      comprasSemana,
      consumoDia,
    },
    graficas: {
      categorias: {
        labels: donutLabels,
        datasets: [
          {
            label: "Productos",
            data: donutValues,
            backgroundColor: [
              "#16a34a",
              "#22d3ee",
              "#facc15",
              "#ef4444",
              "#3b82f6",
            ],
          },
        ],
      },
      consumos: {
        labels: dias,
        datasets: [
          {
            label: "Consumos",
            data: barValues,
            backgroundColor: "#22c55e",
          },
        ],
      },
    },
    stockBajo,
  });
}
