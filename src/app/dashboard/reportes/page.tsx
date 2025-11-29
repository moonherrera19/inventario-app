"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ReportesPage() {
  const [tipo, setTipo] = useState<"diario" | "semanal" | "mensual">("diario");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // =====================================================
  // CARGAR REPORTES
  // =====================================================
  const cargarReporte = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reportes?tipo=${tipo}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error en reportes:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarReporte();
  }, [tipo]);

  // =====================================================
  // EXPORTAR PDF GENERAL
  // =====================================================
  const exportarPDF = async () => {
    const res = await fetch(`/api/reportes/pdf?tipo=${tipo}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // =====================================================
  // EXPORTAR PDF ESPECÍFICO
  // =====================================================
  const exportarPDFEspecifico = async (endpoint: string) => {
    const res = await fetch(`/api/reportes/${endpoint}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // =====================================================
  // EXPORTAR EXCEL
  // =====================================================
  const exportarExcel = () => {
    if (!data || !data.detalle) return;

    const hoja = XLSX.utils.json_to_sheet(data.detalle.todos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reporte");

    const excelBuffer = XLSX.write(libro, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `reporte-${tipo}.xlsx`);
  };

  // =====================================================
  // EXPORTAR CSV
  // =====================================================
  const exportarCSV = () => {
    if (!data || !data.detalle) return;

    const rows = data.detalle.todos;
    const headers = Object.keys(rows[0]).join(",");
    const lines = rows.map((r: any) =>
      Object.values(r).map((v) => `"${v}"`).join(",")
    );

    const csv = [headers, ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, `reporte-${tipo}.csv`);
  };

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">

      {/* ===================================================== */}
      {/* TÍTULO */}
      {/* ===================================================== */}
      <h1 className="text-4xl font-bold text-green-400 drop-shadow-lg mb-6">
        Reportes agrícolas
      </h1>

      {/* ===================================================== */}
      {/* TABS */}
      {/* ===================================================== */}
      <div className="flex gap-3 mb-4">
        {["diario", "semanal", "mensual"].map((tab) => (
          <button
            key={tab}
            onClick={() => setTipo(tab as any)}
            className={`px-5 py-2 rounded-xl font-semibold transition-all ${
              tipo === tab
                ? "bg-green-600 text-white"
                : "bg-[#1a1f25] border border-green-800/40 text-green-300"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ===================================================== */}
      {/* GRUPO 1 — PDF / Excel / CSV */}
      {/* ===================================================== */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={exportarPDF}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold"
        >
          PDF
        </button>

        <button
          onClick={exportarExcel}
          className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl font-semibold"
        >
          Excel
        </button>

        <button
          onClick={exportarCSV}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold"
        >
          CSV
        </button>
      </div>

      {/* ===================================================== */}
      {/* GRUPO 2 — PDFS ESPECÍFICOS */}
      {/* ===================================================== */}
      <div className="flex gap-3 mb-10 flex-wrap">

        <button
          onClick={() => exportarPDFEspecifico("inventario")}
          className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl font-semibold"
        >
          Inventario
        </button>

        <button
          onClick={() => exportarPDFEspecifico("entradas")}
          className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl font-semibold"
        >
          Entradas
        </button>

        <button
          onClick={() => exportarPDFEspecifico("salidas")}
          className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl font-semibold"
        >
          Salidas
        </button>

        <button
          onClick={() => exportarPDFEspecifico("compras")}
          className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl font-semibold"
        >
          Compras
        </button>

        <button
          onClick={() => exportarPDFEspecifico("consumos")}
          className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl font-semibold"
        >
          Consumos
        </button>
      </div>

      {/* ===================================================== */}
      {/* CONTENIDO */}
      {/* ===================================================== */}
      {loading || !data ? (
        <p className="text-gray-400 animate-pulse">Cargando reporte...</p>
      ) : (
        <>
          {/* ===================================================== */}
          {/* KPIs */}
          {/* ===================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <Kpi label="Total Entradas" value={data.resumen.totalEntradas} />
            <Kpi label="Total Salidas" value={data.resumen.totalSalidas} />
            <Kpi label="Total Consumos" value={data.resumen.totalConsumos} />
            <Kpi
              label="Total Gasto ($)"
              value={data.resumen.totalGasto.toFixed(2)}
            />
          </div>

          {/* ===================================================== */}
          {/* SECCIONES */}
          {/* ===================================================== */}
          <Section title="Entradas" color="green">
            <TableMovimientos data={data.detalle.entradas} />
          </Section>

          <Section title="Salidas" color="red">
            <TableMovimientos data={data.detalle.salidas} />
          </Section>

          <Section title="Compras" color="yellow">
            <TableCompras data={data.detalle.compras} />
          </Section>

          <Section title="Consumos por lote" color="blue">
            <TableConsumos data={data.detalle.consumos} />
          </Section>
        </>
      )}
    </div>
  );
}

/* ============================================================
   COMPONENTE KPI
============================================================ */
function Kpi({ label, value }: any) {
  return (
    <div className="bg-[#1a1f25] p-6 rounded-xl border border-green-900/30 shadow-md">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-bold text-green-400">{value}</p>
    </div>
  );
}

/* ============================================================
   COMPONENTE SECCIÓN
============================================================ */
function Section({ title, color, children }: any) {
  const colorClasses: any = {
    green: "text-green-300 border-green-800/40",
    red: "text-red-300 border-red-800/40",
    yellow: "text-yellow-300 border-yellow-700/40",
    blue: "text-blue-300 border-blue-800/40",
  };

  return (
    <div
      className={`bg-[#1a1f25] p-6 rounded-xl border mb-10 ${colorClasses[color]}`}
    >
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

/* ============================================================
   TABLAS
============================================================ */
function TableMovimientos({ data }: any) {
  if (!data || data.length === 0)
    return <p className="text-gray-400">No hay registros.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-green-300 border-b border-green-800/40">
          <th className="py-2">Producto</th>
          <th>Cantidad</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        {data.map((m: any) => (
          <tr
            key={m.id}
            className="border-b border-green-800/20 hover:bg-green-900/10"
          >
            <td className="py-2 text-green-300 font-semibold">
              {m.producto?.nombre}
            </td>
            <td>{m.cantidad}</td>
            <td>{new Date(m.fecha).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableCompras({ data }: any) {
  if (!data || data.length === 0)
    return <p className="text-gray-400">No hay compras registradas.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-yellow-300 border-b border-yellow-700/40">
          <th className="py-2">Producto</th>
          <th>Proveedor</th>
          <th>Cantidad</th>
          <th>Costo Total</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        {data.map((c: any) => (
          <tr
            key={c.id}
            className="border-b border-yellow-700/20 hover:bg-yellow-900/10"
          >
            <td className="py-2 font-semibold text-yellow-300">
              {c.producto?.nombre}
            </td>
            <td>{c.proveedor?.nombre}</td>
            <td>{c.cantidad}</td>
            <td>${(c.costo * c.cantidad).toFixed(2)}</td>
            <td>{new Date(c.fecha).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableConsumos({ data }: any) {
  if (!data || data.length === 0)
    return <p className="text-gray-400">No hay consumos registrados.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-blue-300 border-b border-blue-800/40">
          <th className="py-2">Lote</th>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        {data.map((c: any) => (
          <tr
            key={c.id}
            className="border-b border-blue-800/20 hover:bg-blue-900/10"
          >
            <td className="py-2 text-blue-300 font-semibold">
              {c.lote?.nombre}
            </td>
            <td>{c.producto?.nombre}</td>
            <td>{c.cantidad}</td>
            <td>{new Date(c.fecha).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
