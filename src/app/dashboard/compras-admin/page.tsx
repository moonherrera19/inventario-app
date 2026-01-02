"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EMPRESAS = ["H&C", "BERRIES BEST", "HACHERA", "4BERRIES"];
const ESTATUS = ["CAPTURADA", "APROBADA", "PAGADA"] as const;

type Compra = {
  id: number;
  numeroFactura?: string;
  concepto: string;
  monto: number;
  estatus: "CAPTURADA" | "APROBADA" | "PAGADA";
  fechaFactura?: string;
  fechaPago?: string;
  empresa?: string;
  proveedor: { nombre: string };
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
  const [formFactura, setFormFactura] = useState({
    proveedorId: "",
    empresa: "",
    folio: "",
    concepto: "",
    total: "",
  });

  // ===============================
  // CARGAR COMPRAS
  // ===============================
  const fetchCompras = async () => {
    const res = await fetch("/api/compras-admin");
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
      Proveedor: c.proveedor.nombre,
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
  // EXPORTAR PDF POR EMPRESA
  // ===============================
  const exportarPDF = () => {
    if (!empresa) {
      alert("Selecciona una empresa para exportar el PDF");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Reporte de Compras - ${empresa}`, 14, 15);

    const rows = comprasFiltradas.map(c => ([
      c.proveedor.nombre,
      c.numeroFactura || "",
      c.fechaFactura?.slice(0, 10) || "",
      `$${c.monto.toFixed(2)}`,
      c.estatus,
    ]));

    autoTable(doc, {
      startY: 25,
      head: [["Proveedor", "Folio", "Fecha", "Total", "Estatus"]],
      body: rows,
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

          <input className="bg-black p-2 rounded" placeholder="Buscar folio" value={folio} onChange={e => setFolio(e.target.value)} />
          <input type="date" className="bg-black p-2 rounded" value={desde} onChange={e => setDesde(e.target.value)} />
          <input type="date" className="bg-black p-2 rounded" value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex gap-3 mb-6">
        <button onClick={exportarExcel} className="bg-green-600 px-4 py-2 rounded font-semibold">
          Exportar Excel
        </button>
        <button onClick={exportarPDF} className="bg-red-600 px-4 py-2 rounded font-semibold">
          Exportar PDF por empresa
        </button>
        <button onClick={() => setMostrarFormulario(true)} className="bg-blue-600 px-4 py-2 rounded font-semibold">
          Registrar factura
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
                <th>Proveedor</th>
                <th>Empresa</th>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map(c => (
                <tr key={c.id} className="border-t border-white/10">
                  <td>{c.proveedor.nombre}</td>
                  <td>{c.empresa}</td>
                  <td>{c.numeroFactura}</td>
                  <td>{c.fechaFactura?.slice(0, 10)}</td>
                  <td>${c.monto.toFixed(2)}</td>
                  <td>{c.estatus}</td>
                </tr>
              ))}
              {comprasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-400">
                    No hay registros con esos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR FACTURA */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/70 flex justify-end z-50">
          <div className="w-full max-w-md bg-[#111319] p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Registrar factura</h2>

            <select className="bg-black p-2 rounded w-full mb-3" value={tipoBanco} onChange={e => setTipoBanco(e.target.value as any)}>
              <option value="MX">Banco MX</option>
              <option value="USA">Banco USA</option>
            </select>

            <select className="bg-black p-2 rounded w-full mb-3" value={formFactura.proveedorId}
              onChange={e => setFormFactura({ ...formFactura, proveedorId: e.target.value })}>
              <option value="">Proveedor</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>

            <select className="bg-black p-2 rounded w-full mb-3" value={formFactura.empresa}
              onChange={e => setFormFactura({ ...formFactura, empresa: e.target.value })}>
              <option value="">Empresa</option>
              {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <input className="bg-black p-2 rounded w-full mb-3" placeholder="Folio"
              value={formFactura.folio} onChange={e => setFormFactura({ ...formFactura, folio: e.target.value })} />

            <input className="bg-black p-2 rounded w-full mb-3" placeholder="Concepto"
              value={formFactura.concepto} onChange={e => setFormFactura({ ...formFactura, concepto: e.target.value })} />

            <input type="number" className="bg-black p-2 rounded w-full mb-4" placeholder="Total"
              value={formFactura.total} onChange={e => setFormFactura({ ...formFactura, total: e.target.value })} />

            <button className="bg-blue-600 w-full py-2 rounded font-semibold"
              onClick={async () => {
                await fetch("/api/compras-admin", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...formFactura, banco: tipoBanco }),
                });
                setMostrarFormulario(false);
                fetchCompras();
              }}>
              Guardar factura
            </button>

            <button className="text-gray-400 mt-4 w-full" onClick={() => setMostrarFormulario(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
