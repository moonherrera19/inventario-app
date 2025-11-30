"use client";

import { useEffect, useState } from "react";

// Componentes KPI
import KpiCard from "@/components/dashboard/KpiCard";

// Gráficas
import GraficaEntradasSalidas from "@/components/dashboard/GraficaEntradasSalidas";
import CategoriasDonut from "@/components/dashboard/charts/CategoriasDonut";
import ProveedoresBar from "@/components/dashboard/charts/ProveedoresBar";
import TopProductos from "@/components/dashboard/charts/TopProductos";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [topProductos, setTopProductos] = useState([]);

  // Cargar estadísticas
  useEffect(() => {
    fetch("/api/dashboard/stats").then((r) => r.json()).then(setStats);
    fetch("/api/dashboard/charts/categorias").then((r) => r.json()).then(setCategorias);
    fetch("/api/dashboard/charts/proveedores").then((r) => r.json()).then(setProveedores);
    fetch("/api/dashboard/charts/topProductos").then((r) => r.json()).then(setTopProductos);
  }, []);

  if (!stats)
    return <p className="text-white text-lg p-6">Cargando dashboard...</p>;

  // ==============================
  // GRAFICA PRINCIPAL YA SIN ENTRADAS/SALIDAS
  // ==============================
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const dataGrafica = dias.map((dia) => ({
    dia,
    entradas: 0, // módulos eliminados
    salidas: 0,
  }));

  return (
    <div className="p-6 text-white">

      <h1 className="text-4xl font-bold mb-8">Dashboard Agrícola</h1>

      {/* ==========================
          KPI CARDS
      =========================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">

        <KpiCard
          title="Productos Totales"
          value={stats.totalProductos ?? 0}
        />

        <KpiCard
          title="Stock Bajo"
          value={stats.stockBajo ?? 0}
          color="red"
        />

        <KpiCard
          title="Valor Total Inventario"
          value={`$${(stats.valorInventario ?? 0).toFixed(2)}`}
        />

        <KpiCard
          title="Gasto en Compras (Mes)"
          value={`$${(stats.comprasMes ?? 0).toFixed(2)}`}
        />

      </div>

      {/* GRAFICA PRINCIPAL */}
      <div className="mb-10">
        <GraficaEntradasSalidas data={dataGrafica} />
      </div>

      {/* GRAFICAS SECUNDARIAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <CategoriasDonut data={categorias} />
        <ProveedoresBar data={proveedores} />
        <TopProductos data={topProductos} />
      </div>

    </div>
  );
}
