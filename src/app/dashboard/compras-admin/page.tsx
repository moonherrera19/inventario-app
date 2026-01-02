"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EMPRESAS = ["H&C", "BERRIES BEST", "HACHERA", "4BERRIES"];
const ESTATUS = ["CAPTURADA", "APROBADA", "PAGADA"] as const;

type Proveedor = {
  id: number;
  nombre: string;
  banco?: string;
  numeroCuenta?: string;
  clabe?: string;
  bancoDolares?: string;
  numeroCuentaDolares?: string;
  clabeDolares?: string;
};

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
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoBanco, setTipoBanco] = useState<"MX" | "USA">("MX");
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);

  // ===============================
  // FILTROS
  // ===============================
  const [empresa, setEmpresa] = useState("");
  const [estatus, setEstatus] = useState("");
  const [folio, setFolio] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // ===============================
  // FORM FACTURA
  // ===============================
  const hoy = new Date().toISOString().split("T")[0];

  const [formFactura, setFormFactura] = useState({
    proveedorId: "",
    proveedorNombre: "",
    banco: "",
    cuentaClabe: "",
    empresa: "H&C",
    folio: "",
    concepto: "",
    total: "",
    fechaFactura: hoy,
  });

  // ===============================
  // CARGAR DATA
  // ===============================
  const fetchAll = async () => {
    const [c, p] = await Promise.all([
      fetch("/api/compras-admin").then(r => r.json()),
      fetch("/api/proveedores").then(r => r.json()),
    ]);
    setCompras(c.compras || []);
    setProveedores(p || []);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ===============================
  // AUTOLLENADO PROVEEDOR
  // ===============================
  const onSelectProveedor = (id: string) => {
    const prov = proveedores.find(p => p.id === Number(id));
    if (!prov) return;

    if (tipoBanco === "USA") {
      setFormFactura(f => ({
        ...f,
        proveedorId: id,
        proveedorNombre: prov.nombre,
        banco: prov.bancoDolares || "",
        cuentaClabe: prov.numeroCuentaDolares || prov.clabeDolares || "",
      }));
    } else {
      setFormFactura(f => ({
        ...f,
        proveedorId: id,
        proveedorNombre: prov.nombre,
        banco: prov.banco || "",
        cuentaClabe: prov.numeroCuenta || prov.clabe || "",
      }));
    }
  };

  // ===============================
  // FILTRADO
  // ===============================
  const comprasFiltradas = compras.filter(c => {
    if (empresa && c.empresa !== empresa) return false;
    if (estatus && c.estatus !== estatus) return false;
    if (folio && !c.numeroFactura?.toLowerCase().includes(folio.toLowerCase())) return false;
    if (desde && c.fechaFactura && new Date(c.fechaFactura) < new Date(desde)) return false;
    if (hasta && c.fechaFactura && new Date(c.fechaFactura) > new Date(hasta)) return false;
    return true;
  });

  // ===============================
  // TOTALES
  // ===============================
  const total = (e: string) =>
    comprasFiltradas.filter(c => c.estatus === e).reduce((s, c) => s + c.monto, 0);

  // ===============================
  // GUARDAR FACTURA
  // ===============================
  const guardarFactura = async () => {
    await fetch("/api/compras-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proveedorId: Number(formFactura.proveedorId),
        banco: formFactura.banco,
        cuentaClabe: formFactura.cuentaClabe,
        empresa: formFactura.empresa,
        numeroFactura: formFactura.folio,
        concepto: formFactura.concepto,
        monto: Number(formFactura.total),
        fechaFactura: formFactura.fechaFactura,
      }),
    });

    setMostrarFormulario(false);
    fetchAll();
  };

  // ===============================
  // IMPORTAR EXCEL
  // ===============================
  const importarExcel = async () => {
    if (!archivoExcel) return;

    const fd = new FormData();
    fd.append("file", archivoExcel);

    await fetch("/api/compras-admin", {
      method: "POST",
      body: fd,
    });

    setArchivoExcel(null);
    fetchAll();
  };

  // ===============================
  // EXPORTACIONES
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

  const exportarPDF = () => {
    if (!empresa) return alert("Selecciona empresa");

    const doc = new jsPDF();
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

      {/* BOTONES */}
      <div className="flex gap-3 mb-6">
        <button onClick={exportarExcel} className="bg-green-600 px-4 py-2 rounded">Exportar Excel</button>
        <button onClick={exportarPDF} className="bg-red-600 px-4 py-2 rounded">Exportar PDF</button>

        <input type="file" accept=".xlsx,.xls" onChange={e => setArchivoExcel(e.target.files?.[0] || null)} />
        <button onClick={importarExcel} className="bg-green-700 px-4 py-2 rounded">Importar Excel</button>

        <button onClick={() => setMostrarFormulario(true)} className="bg-blue-600 px-4 py-2 rounded">
          Registrar factura
        </button>
      </div>

      {/* TOTALES */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>Capturadas ${total("CAPTURADA").toFixed(2)}</div>
        <div>Aprobadas ${total("APROBADA").toFixed(2)}</div>
        <div>Pagadas ${total("PAGADA").toFixed(2)}</div>
      </div>

      {/* MODAL */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/70 flex justify-end">
          <div className="w-full max-w-md bg-[#111319] p-6">
            <h2 className="text-xl mb-4">Registrar factura</h2>

            <select className="w-full mb-2" value={tipoBanco} onChange={e => setTipoBanco(e.target.value as any)}>
              <option value="MX">Banco MX</option>
              <option value="USA">Banco USA</option>
            </select>

            <select className="w-full mb-2" onChange={e => onSelectProveedor(e.target.value)}>
              <option value="">Proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>

            <input disabled value={formFactura.banco} className="w-full mb-2" />
            <input disabled value={formFactura.cuentaClabe} className="w-full mb-2" />

            <select className="w-full mb-2" value={formFactura.empresa}
              onChange={e => setFormFactura(f => ({ ...f, empresa: e.target.value }))}>
              {EMPRESAS.map(e => <option key={e}>{e}</option>)}
            </select>

            <input placeholder="Folio" className="w-full mb-2"
              onChange={e => setFormFactura(f => ({ ...f, folio: e.target.value }))} />
            <input placeholder="Concepto" className="w-full mb-2"
              onChange={e => setFormFactura(f => ({ ...f, concepto: e.target.value }))} />
            <input placeholder="Total" type="number" className="w-full mb-2"
              onChange={e => setFormFactura(f => ({ ...f, total: e.target.value }))} />

            <button onClick={guardarFactura} className="bg-blue-600 w-full py-2 rounded">
              Guardar factura
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
