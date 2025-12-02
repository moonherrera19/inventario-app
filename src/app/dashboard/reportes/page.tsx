"use client";

import { useEffect, useState } from "react";

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
      <div className="flex gap-3 mb-6">
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
      {/* SOLO UN BOTÓN PDF */}
      {/* ===================================================== */}
      <div className="mb-8">
        <button
          onClick={exportarPDF}
          className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl font-semibold"
        >
          Generar PDF General
        </button>
      </div>

      {/* ===================================================== */}
      {/* REPORTES ESPECÍFICOS */}
      {/* ===================================================== */}
      <h2 className="text-xl font-bold text-green-400 mb-3">Reportes específicos</h2>

      <div className="flex flex-wrap gap-3 mb-10">

        <BotonReporte
          label="Inventario General"
          onClick={() => exportarPDFEspecifico("inventario")}
        />

        <BotonReporte
          label="Entradas"
          onClick={() => exportarPDFEspecifico("entradas")}
        />

        <BotonReporte
          label="Salidas"
          onClick={() => exportarPDFEspecifico("salidas")}
        />

        <BotonReporte
          label="Compras"
          onClick={() => exportarPDFEspecifico("compras")}
        />

        <BotonReporte
          label="Recetas"
          onClick={() => exportarPDFEspecifico("recetas")}
        />

      </div>

      {/* ===================================================== */}
      {/* CONTENIDO DINÁMICO */}
      {/* ===================================================== */}
      {loading || !data ? (
        <p className="text-gray-400 animate-pulse">Cargando reporte...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <Kpi label="Entradas" value={data.resumen.totalEntradas} />
            <Kpi label="Salidas" value={data.resumen.totalSalidas} />
            <Kpi label="Compras" value={data.resumen.totalCompras} />
            <Kpi label="Total Gastado ($)" value={data.resumen.totalGasto.toFixed(2)} />
          </div>

          {/* Entradas */}
          <Section title="Entradas" color="green">
            <TableSimple data={data.detalle.entradas} tipo="entradas" />
          </Section>

          {/* Salidas */}
          <Section title="Salidas" color="red">
            <TableSimple data={data.detalle.salidas} tipo="salidas" />
          </Section>

          {/* Compras */}
          <Section title="Compras" color="yellow">
            <TableSimple data={data.detalle.compras} tipo="compras" />
          </Section>

          {/* Recetas */}
          <Section title="Recetas / Ingredientes" color="blue">
            <TableSimple data={data.detalle.recetas} tipo="recetas" />
          </Section>
        </>
      )}
    </div>
  );
}

/* ============================================================
   COMPONENTE BOTÓN
============================================================ */
function BotonReporte({ label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl font-semibold"
    >
      {label}
    </button>
  );
}

/* ============================================================
   KPI
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
   SECCIÓN
============================================================ */
function Section({ title, color, children }: any) {
  const colorClasses: any = {
    green: "text-green-300 border-green-800/40",
    red: "text-red-300 border-red-800/40",
    yellow: "text-yellow-300 border-yellow-700/40",
    blue: "text-blue-300 border-blue-800/40",
  };

  return (
    <div className={`bg-[#1a1f25] p-6 rounded-xl border mb-10 ${colorClasses[color]}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

/* ============================================================
   TABLA SIMPLE
============================================================ */
function TableSimple({ data, tipo }: any) {
  if (!data || data.length === 0)
    return <p className="text-gray-400">No hay registros.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-600/40 text-gray-300">
          {Object.keys(data[0]).map((k) => (
            <th key={k} className="py-2 capitalize">
              {k}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((item: any, i: number) => (
          <tr
            key={i}
            className="border-b border-gray-700/20 hover:bg-gray-700/10"
          >
            {Object.values(item).map((v: any, j: number) => (
              <td key={j} className="py-2">
                {String(v)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
