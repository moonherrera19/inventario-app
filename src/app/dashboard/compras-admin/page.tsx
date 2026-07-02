"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ModalCargaMasiva from "@/components/modals/ModalCargaMasiva";
import ModalRegistrarFactura from "@/components/modals/ModalRegistrarFactura";

const EMPRESAS = ["H&C", "BERRIES BEST", "HACHERA", "4BERRIES"];
const ESTATUS = ["CAPTURADA", "APROBADA", "PAGADA"] as const;

type Compra = {
  id: number;
  numeroFactura?: string | null;
  concepto: string;
  monto: number;
  estatus: "CAPTURADA" | "APROBADA" | "PAGADA";
  banco?: string | null;
  cuentaClabe?: string | null;
  moneda?: string | null;
  fechaFactura?: string | null;
  fechaPago?: string | null;
  empresa?: string | null;
  proveedor?: {
    nombre: string;
  } | null;
};

export default function ComprasAdminPage() {
  const [compras, setCompras] = useState<Compra[]>([]);

  // ===============================
  // FILTROS
  // ===============================
  const [empresa, setEmpresa] = useState("");
  const [estatus, setEstatus] = useState("");
  const [folio, setFolio] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // ===============================
  // MODALES
  // ===============================
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [openCargaMasiva, setOpenCargaMasiva] = useState(false);

  // ===============================
  // CARGAR COMPRAS
  // ===============================
  const fetchCompras = async () => {
    const res = await fetch("/api/compras-admin", {
      cache: "no-store",
    });
    const data = await res.json();
    setCompras(data.compras || []);
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  // ===============================
  // CAMBIAR ESTATUS (APROBAR / PAGAR)
  // ===============================
  const cambiarEstatus = async (
    id: number,
    nuevoEstatus: "APROBADA" | "PAGADA"
  ) => {
    const confirmar = confirm(
      `¿Seguro que deseas marcar esta compra como ${nuevoEstatus}?`
    );
    if (!confirmar) return;

    const res = await fetch(`/api/compras-admin/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatus: nuevoEstatus }),
    });

    if (!res.ok) {
      alert("Error al cambiar estatus");
      return;
    }

    fetchCompras();
  };

  // ===============================
  // ACTUALIZAR FECHA DE PAGO
  // Funciona para CUALQUIER estatus
  // ===============================
  const actualizarFechaPago = async (id: number, fechaPago: string) => {
    try {
      const res = await fetch(`/api/compras-admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaPago: fechaPago || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error actualizando fecha");
      }

      await fetchCompras();
    } catch (error) {
      console.error("Error fecha pago:", error);
      alert("No se pudo actualizar la fecha");
    }
  };

  // ===============================
  // FILTRADO CENTRAL
  // ===============================
  const comprasFiltradas = compras.filter((c) => {
    if (empresa && c.empresa !== empresa) return false;
    if (estatus && c.estatus !== estatus) return false;
    if (
      folio &&
      !c.numeroFactura?.toLowerCase().includes(folio.toLowerCase())
    )
      return false;
    if (
      desde &&
      c.fechaFactura &&
      new Date(c.fechaFactura) < new Date(desde)
    )
      return false;
    if (
      hasta &&
      c.fechaFactura &&
      new Date(c.fechaFactura) > new Date(hasta)
    )
      return false;
    return true;
  });

  // ===============================
  // TOTALES POR ESTATUS
  // ===============================
  const totalPorEstatus = (e: string) =>
    comprasFiltradas
      .filter((c) => c.estatus === e)
      .reduce((s, c) => s + c.monto, 0);

  // ===============================
  // EXPORTAR EXCEL
  // ===============================
  const exportarExcel = () => {
    const data = comprasFiltradas.map((c) => ({
      Proveedor: c.proveedor?.nombre || "SIN PROVEEDOR",
      Empresa: c.empresa,
      Folio: c.numeroFactura,
      "Fecha Emisión": c.fechaFactura?.slice(0, 10),
      Total: c.monto,
      Estatus: c.estatus,
      "Fecha Pago": c.fechaPago?.slice(0, 10) || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Compras");
    XLSX.writeFile(wb, "reporte_compras.xlsx");
  };

  // ===============================
  // EXPORTAR PDF
  // ===============================
  const exportarPDF = () => {
    if (!empresa) {
      alert("Selecciona una empresa para exportar PDF");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Reporte de Compras - ${empresa}`, 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Proveedor", "Folio", "Fecha Emisión", "Total", "Estatus", "Fecha Pago"]],
      body: comprasFiltradas.map((c) => [
        c.proveedor?.nombre || "SIN PROVEEDOR",
        c.numeroFactura || "",
        c.fechaFactura?.slice(0, 10) || "",
        `$${c.monto.toFixed(2)}`,
        c.estatus,
        c.fechaPago?.slice(0, 10) || "",
      ]),
    });

    doc.save(`reporte_${empresa}.pdf`);
  };

  // ===============================
  // BORRAR TODO
  // ===============================
  const borrarTodo = async () => {
    const confirmar = confirm(
      "⚠️ ¿Seguro que quieres borrar TODAS las compras?"
    );
    if (!confirmar) return;

    try {
      const res = await fetch("/api/compras-admin/reset", {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.ok) {
        alert("✅ Datos eliminados correctamente");
        window.location.reload();
      } else {
        alert("❌ Error al borrar");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error de conexión");
    }
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">
      <h1 className="text-3xl font-bold text-green-400 mb-6">
        Compras Administrativas
      </h1>

      {/* ── FILTROS ── */}
      <div className="bg-[#111319] p-4 rounded-xl border border-white/10 mb-4">
        <h2 className="font-semibold mb-3 text-green-300">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            className="bg-black p-2 rounded text-white"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          >
            <option value="">Todas las empresas</option>
            {EMPRESAS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          <select
            className="bg-black p-2 rounded text-white"
            value={estatus}
            onChange={(e) => setEstatus(e.target.value)}
          >
            <option value="">Todos los estatus</option>
            {ESTATUS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          <input
            className="bg-black p-2 rounded text-white"
            placeholder="Buscar folio"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
          />

          <input
            type="date"
            className="bg-black p-2 rounded text-white"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />

          <input
            type="date"
            className="bg-black p-2 rounded text-white"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
      </div>

      {/* ── BOTONES ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={exportarExcel}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold transition-colors"
        >
          Exportar Excel
        </button>
        <button
          onClick={exportarPDF}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-colors"
        >
          Exportar PDF
        </button>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold transition-colors"
        >
          Registrar factura
        </button>
        <button
          onClick={borrarTodo}
          className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded font-semibold transition-colors"
        >
          Borrar Todo
        </button>
        <button
          onClick={() => setOpenCargaMasiva(true)}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold transition-colors"
        >
          Carga masiva (Excel)
        </button>
      </div>

      {/* ── TOTALES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111319] p-4 rounded border border-yellow-600">
          <p className="text-yellow-400 text-sm">Capturadas</p>
          <p className="text-xl font-bold">
            ${totalPorEstatus("CAPTURADA").toFixed(2)}
          </p>
        </div>
        <div className="bg-[#111319] p-4 rounded border border-blue-600">
          <p className="text-blue-400 text-sm">Aprobadas</p>
          <p className="text-xl font-bold">
            ${totalPorEstatus("APROBADA").toFixed(2)}
          </p>
        </div>
        <div className="bg-[#111319] p-4 rounded border border-green-600">
          <p className="text-green-400 text-sm">Pagadas</p>
          <p className="text-xl font-bold">
            ${totalPorEstatus("PAGADA").toFixed(2)}
          </p>
        </div>
      </div>

      {/* ── TABLA ── */}
      <div className="bg-[#111319] p-4 rounded-xl border border-white/10">
        <h2 className="font-semibold mb-3">
          Facturas ({comprasFiltradas.length})
        </h2>

        <div className="overflow-auto max-h-[500px]">
          <table className="w-full text-sm">

            {/* ── THEAD CORREGIDO ── */}
            <thead className="sticky top-0 bg-[#111319] text-left text-xs text-white/50 uppercase z-10">
              <tr>
                <th className="px-2 py-3 whitespace-nowrap">Folio</th>
                <th className="px-2 py-3 whitespace-nowrap">Proveedor</th>
                <th className="px-2 py-3 whitespace-nowrap">Banco</th>
                <th className="px-2 py-3 whitespace-nowrap">Cuenta / CLABE</th>
                <th className="px-2 py-3 whitespace-nowrap text-right">Total</th>
                <th className="px-2 py-3 whitespace-nowrap">Fecha emisión</th>
                <th className="px-2 py-3 whitespace-nowrap">Producto</th>
                <th className="px-2 py-3 whitespace-nowrap text-right">Precio</th>
                <th className="px-2 py-3 whitespace-nowrap">Moneda</th>
                <th className="px-2 py-3 whitespace-nowrap">Empresa</th>
                <th className="px-2 py-3 whitespace-nowrap">Estatus</th>
                {/* ── COLUMNA FECHA PAGO – editable en todos los estatus ── */}
                <th className="px-2 py-3 whitespace-nowrap">Fecha pago</th>
                <th className="px-2 py-3 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>

            {/* ── TBODY ── */}
            <tbody>
              {comprasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="text-center py-8 text-white/30 text-sm"
                  >
                    Sin resultados para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                comprasFiltradas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-white/10 hover:bg-white/5 transition-colors"
                  >
                    {/* Folio */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      {c.numeroFactura || "—"}
                    </td>

                    {/* Proveedor */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      {c.proveedor?.nombre || "SIN PROVEEDOR"}
                    </td>

                    {/* Banco */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      {c.banco || "—"}
                    </td>

                    {/* Cuenta / CLABE */}
                    <td className="px-2 py-2 whitespace-nowrap font-mono text-xs">
                      {c.cuentaClabe || "—"}
                    </td>

                    {/* Total */}
                    <td className="px-2 py-2 text-right font-semibold whitespace-nowrap">
                      ${c.monto.toFixed(2)}
                    </td>

                    {/* Fecha emisión */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      {c.fechaFactura?.slice(0, 10) || "—"}
                    </td>

                    {/* Producto / Concepto */}
                    <td className="px-2 py-2">{c.concepto}</td>

                    {/* Precio (mismo que monto) */}
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      ${c.monto.toFixed(2)}
                    </td>

                    {/* Moneda */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      {c.moneda || "MXN"}
                    </td>

                    {/* Empresa */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      {c.empresa || "—"}
                    </td>

                    {/* Estatus badge */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          c.estatus === "CAPTURADA"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : c.estatus === "APROBADA"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {c.estatus}
                      </span>
                    </td>

                    {/* ── FECHA PAGO – editable en TODOS los estatus ── */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="date"
                        className="bg-[#1a1d26] border border-white/20 hover:border-white/40 focus:border-green-500 focus:outline-none rounded px-2 py-1 text-xs text-white w-36 transition-colors cursor-pointer"
                        defaultValue={c.fechaPago?.slice(0, 10) ?? ""}
                        onChange={(e) =>
                          actualizarFechaPago(c.id, e.target.value)
                        }
                      />
                    </td>

                    {/* Acciones */}
                    <td className="px-2 py-2 whitespace-nowrap">
                      {c.estatus === "CAPTURADA" && (
                        <button
                          onClick={() => cambiarEstatus(c.id, "APROBADA")}
                          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          Aprobar
                        </button>
                      )}

                      {c.estatus === "APROBADA" && (
                        <button
                          onClick={() => cambiarEstatus(c.id, "PAGADA")}
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          Marcar pagada
                        </button>
                      )}

                      {c.estatus === "PAGADA" && (
                        <span className="text-green-400 text-xs font-semibold">
                          ✔ Pagada
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODALES ── */}
      <ModalCargaMasiva
        open={openCargaMasiva}
        onClose={() => setOpenCargaMasiva(false)}
        onSuccess={fetchCompras}
      />
      <ModalRegistrarFactura
        open={mostrarFormulario}
        onClose={() => setMostrarFormulario(false)}
        onSuccess={fetchCompras}
      />
    </div>
  );
}