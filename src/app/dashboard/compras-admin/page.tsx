"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ModalCargaMasiva from "@/components/modals/ModalCargaMasiva";

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
  // REGISTRAR FACTURA
  // ===============================
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoBanco, setTipoBanco] = useState<"MX" | "USA">("MX");
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<any | null>(null);

  const [formFactura, setFormFactura] = useState({
    proveedorId: "",
    empresa: "",
    folio: "",
    concepto: "",
    total: "",
  });

  // ===============================
  // CARGA MASIVA
  // ===============================
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
  // CARGAR PROVEEDORES POR BANCO
  // ===============================
  useEffect(() => {
    if (!mostrarFormulario) return;

    const fetchProveedores = async () => {
      const res = await fetch(`/api/proveedores?banco=${tipoBanco}`);
      const data = await res.json();
      setProveedores(data || []);
    };

    fetchProveedores();
  }, [tipoBanco, mostrarFormulario]);

  // ===============================
  // FILTRADO CENTRAL
  // ===============================
  const comprasFiltradas = compras.filter(c => {
    if (empresa && c.empresa !== empresa) return false;
    if (estatus && c.estatus !== estatus) return false;
    if (folio && !c.numeroFactura?.toLowerCase().includes(folio.toLowerCase()))
      return false;
    if (desde && c.fechaFactura && new Date(c.fechaFactura) < new Date(desde))
      return false;
    if (hasta && c.fechaFactura && new Date(c.fechaFactura) > new Date(hasta))
      return false;
    return true;
  });

  // ===============================
  // TOTALES
  // ===============================
  const totalPorEstatus = (e: string) =>
    comprasFiltradas
      .filter(c => c.estatus === e)
      .reduce((s, c) => s + c.monto, 0);

  // ===============================
  // EXPORTAR EXCEL
  // ===============================
const exportarExcel = () => {
  const data = comprasFiltradas.map(c => ({
    Proveedor: c.proveedor?.nombre || "SIN PROVEEDOR",
    Empresa: c.empresa,
    Folio: c.numeroFactura,
    Fecha: c.fechaFactura?.slice(0, 10),
    Total: c.monto,
    Estatus: c.estatus,
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
      alert("Selecciona una empresa");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Reporte de Compras - ${empresa}`, 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Proveedor", "Folio", "Fecha", "Total", "Estatus"]],
      body: comprasFiltradas.map(c => [
        c.proveedor.nombre,
        c.numeroFactura || "",
        c.fechaFactura?.slice(0, 10) || "",
        `$${c.monto.toFixed(2)}`,
        c.estatus,
      ]),
    });

    doc.save(`reporte_${empresa}.pdf`);
  };

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">
      <h1 className="text-3xl font-bold text-green-400 mb-6">
        Compras Administrativas
      </h1>

      {/* FILTROS */}
      <div className="bg-[#111319] p-4 rounded-xl border border-white/10 mb-4">
        <h2 className="font-semibold mb-3 text-green-300">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select className="bg-black p-2 rounded" value={empresa} onChange={e => setEmpresa(e.target.value)}>
            <option value="">Todas las empresas</option>
            {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <select className="bg-black p-2 rounded" value={estatus} onChange={e => setEstatus(e.target.value)}>
            <option value="">Todos los estatus</option>
            {ESTATUS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <input className="bg-black p-2 rounded" placeholder="Buscar folio" value={folio}
            onChange={e => setFolio(e.target.value)} />

          <input type="date" className="bg-black p-2 rounded" value={desde}
            onChange={e => setDesde(e.target.value)} />

          <input type="date" className="bg-black p-2 rounded" value={hasta}
            onChange={e => setHasta(e.target.value)} />
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex gap-3 mb-6">
        <button onClick={exportarExcel} className="bg-green-600 px-4 py-2 rounded font-semibold">
          Exportar Excel
        </button>
        <button onClick={exportarPDF} className="bg-red-600 px-4 py-2 rounded font-semibold">
          Exportar PDF
        </button>
        <button onClick={() => setMostrarFormulario(true)} className="bg-blue-600 px-4 py-2 rounded font-semibold">
          Registrar factura
        </button>
        <button
          onClick={() => setOpenCargaMasiva(true)}
          className="bg-purple-600 px-4 py-2 rounded font-semibold"
        >
          Carga masiva (Excel)
        </button>
      </div>

      {/* TOTALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111319] p-4 rounded border border-yellow-600">
          <p className="text-yellow-400">Capturadas</p>
          <p className="text-xl font-bold">${totalPorEstatus("CAPTURADA").toFixed(2)}</p>
        </div>
        <div className="bg-[#111319] p-4 rounded border border-blue-600">
          <p className="text-blue-400">Aprobadas</p>
          <p className="text-xl font-bold">${totalPorEstatus("APROBADA").toFixed(2)}</p>
        </div>
        <div className="bg-[#111319] p-4 rounded border border-green-600">
          <p className="text-green-400">Pagadas</p>
          <p className="text-xl font-bold">${totalPorEstatus("PAGADA").toFixed(2)}</p>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-[#111319] p-4 rounded-xl border border-white/10">
        <h2 className="font-semibold mb-3">Facturas</h2>

        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-sm">
            <thead className="text-green-300">
                <tr>
    <th className="px-2 py-2">Folio</th>
    <th className="px-2 py-2">Proveedor</th>
    <th className="px-2 py-2">Banco</th>
    <th className="px-2 py-2">Cuenta / CLABE</th>
    <th className="px-2 py-2 text-right">Total</th>
    <th className="px-2 py-2">Fecha emisión</th>
    <th className="px-2 py-2">Producto</th>
    <th className="px-2 py-2 text-right">Precio</th>
    <th className="px-2 py-2">Moneda</th>
    <th className="px-2 py-2">Empresa</th>
    <th className="px-2 py-2">Estatus</th>
    <th className="px-2 py-2">Fecha del pago</th>
  </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map(c => (
                 <tr
      key={c.id}
      className="border-t border-white/10 hover:bg-white/5"
    >
      <td className="px-2 py-1">{c.numeroFactura || "—"}</td>

      <td className="px-2 py-1">
        {c.proveedor?.nombre || "SIN PROVEEDOR"}
      </td>

      <td className="px-2 py-1">{c.banco || "—"}</td>

      <td className="px-2 py-1">{c.cuentaClabe || "—"}</td>

      <td className="px-2 py-1 text-right font-semibold">
        ${c.monto.toFixed(2)}
      </td>

      <td className="px-2 py-1">
        {c.fechaFactura?.slice(0, 10) || "—"}
      </td>

      <td className="px-2 py-1">{c.concepto}</td>

      <td className="px-2 py-1 text-right">
        ${c.monto.toFixed(2)}
      </td>

      <td className="px-2 py-1">{c.moneda || "MXN"}</td>

      <td className="px-2 py-1">{c.empresa || "—"}</td>

      <td className="px-2 py-1">
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

      <td className="px-2 py-1">
        {c.fechaPago?.slice(0, 10) || "—"}
      </td>
    </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CARGA MASIVA */}
      <ModalCargaMasiva
        open={openCargaMasiva}
        onClose={() => setOpenCargaMasiva(false)}
        onSuccess={fetchCompras}
      />
    </div>
  );
}
