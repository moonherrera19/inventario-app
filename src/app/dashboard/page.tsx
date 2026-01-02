"use client";

import { useEffect, useState } from "react";

// Componentes KPI
import KpiCard from "@/components/dashboard/KpiCard";

// Gráficas
import GraficaEntradasSalidas from "@/components/dashboard/GraficaEntradasSalidas";
import CategoriasDonut from "@/components/dashboard/charts/CategoriasDonut";
import ProveedoresBar from "@/components/dashboard/charts/ProveedoresBar";
import TopProductos from "@/components/dashboard/charts/TopProductos";

// ⭐ Stats por defecto (SEGURO)
const statsDefault = {
  totalProductos: 0,
  stockBajo: 0,
  valorInventario: 0,
  comprasMes: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState(statsDefault);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [topProductos, setTopProductos] = useState<any[]>([]);

  // ==============================
  // CARGAR DATOS DEL DASHBOARD
  // ==============================
  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => setStats(data || statsDefault))
      .catch(() => setStats(statsDefault));

    fetch("/api/dashboard/charts/categorias")
      .then((r) => r.json())
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => setCategorias([]));

    fetch("/api/dashboard/charts/proveedores")
      .then((r) => r.json())
      .then((data) => setProveedores(Array.isArray(data) ? data : []))
      .catch(() => setProveedores([]));

    fetch("/api/dashboard/charts/topProductos")
      .then((r) => r.json())
      .then((data) => setTopProductos(Array.isArray(data) ? data : []))
      .catch(() => setTopProductos([]));
  }, []);

  // ==============================
  // GRAFICA PRINCIPAL (PLACEHOLDER)
  // ==============================
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const dataGrafica = dias.map((dia) => ({
    dia,
    entradas: 0,
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
          value={Number(stats?.totalProductos ?? 0)}
        />

        <KpiCard
          title="Stock Bajo"
          value={Number(stats?.stockBajo ?? 0)}
          color="red"
        />

        <KpiCard
          title="Valor Total Inventario"
          value={`$${Number(stats?.valorInventario ?? 0).toFixed(2)}`}
        />

        <KpiCard
          title="Gasto en Compras (Mes)"
          value={`$${Number(stats?.comprasMes ?? 0).toFixed(2)}`}
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
