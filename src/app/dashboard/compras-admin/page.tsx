"use client";

import { useEffect, useState } from "react";

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
  banco?: string;
  cuentaClabe?: string;
  empresa?: string;
  concepto: string;
  monto: number;
  estatus: "CAPTURADA" | "APROBADA" | "PAGADA";
  fechaFactura?: string;
  fechaPago?: string;
  proveedor: { nombre: string };
};

export default function ComprasAdminPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  const [form, setForm] = useState<any>({
    proveedorId: "",
    banco: "",
    cuentaClabe: "",
    empresa: "",
    moneda: "MXN",
    numeroFactura: "",
    concepto: "",
    monto: "",
  });

  // ===============================
  // CARGAR DATOS
  // ===============================
  const fetchAll = async () => {
    const [p, c] = await Promise.all([
      fetch("/api/proveedores").then(r => r.json()),
      fetch("/api/compras-admin").then(r => r.json()),
    ]);
    setProveedores(p);
    setCompras(c.compras);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ===============================
  // AUTOFILL PROVEEDOR
  // ===============================
  const onSelectProveedor = (id: number) => {
    const prov = proveedores.find(p => p.id === id);
    if (!prov) return;

    const banco =
      form.moneda === "USD"
        ? prov.bancoDolares
        : prov.banco;

    const cuenta =
      form.moneda === "USD"
        ? prov.numeroCuentaDolares || prov.clabeDolares
        : prov.numeroCuenta || prov.clabe;

    setForm({
      ...form,
      proveedorId: id,
      banco: banco || "",
      cuentaClabe: cuenta || "",
    });
  };

  // ===============================
  // CREAR COMPRA
  // ===============================
  const guardarCompra = async () => {
    await fetch("/api/compras-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        proveedorId: Number(form.proveedorId),
        monto: Number(form.monto),
        fechaFactura: new Date(), // hoy
      }),
    });

    setForm({
      proveedorId: "",
      banco: "",
      cuentaClabe: "",
      empresa: "",
      moneda: "MXN",
      numeroFactura: "",
      concepto: "",
      monto: "",
    });

    fetchAll();
  };

  // ===============================
  // IMPORTAR EXCEL
  // ===============================
  const importarExcel = async () => {
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    await fetch("/api/compras-admin", {
      method: "POST",
      body: fd,
    });

    setFile(null);
    fetchAll();
  };

  // ===============================
  // CAMBIAR ESTATUS
  // ===============================
  const cambiarEstatus = async (id: number, estatus: string) => {
    await fetch(`/api/compras-admin?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estatus,
        fechaPago: estatus === "PAGADA" ? new Date() : null,
      }),
    });
    fetchAll();
  };

  // ===============================
  // FILTROS
  // ===============================
  const comprasFiltradas = compras.filter(c => {
    if (filtroEmpresa && c.empresa !== filtroEmpresa) return false;
    if (filtroEstatus && c.estatus !== filtroEstatus) return false;
    return true;
  });

  const total = (e: string) =>
    comprasFiltradas
      .filter(c => c.estatus === e)
      .reduce((s, c) => s + c.monto, 0);

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">
      <h1 className="text-3xl font-bold text-green-400 mb-6">
        Compras Administrativas
      </h1>

      {/* IMPORTAR */}
      <div className="flex gap-3 mb-6">
        <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button onClick={importarExcel} className="bg-green-600 px-4 py-2 rounded">
          Importar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORM */}
        <div className="bg-[#111319] p-5 rounded-xl">
          <h2 className="mb-4 font-semibold">Registrar factura</h2>

          <select className="w-full mb-2 p-2 bg-black rounded"
            value={form.proveedorId}
            onChange={e => onSelectProveedor(Number(e.target.value))}
          >
            <option value="">Proveedor</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          <input disabled value={form.banco} className="w-full mb-2 p-2 bg-black rounded" />
          <input disabled value={form.cuentaClabe} className="w-full mb-2 p-2 bg-black rounded" />

          <input placeholder="Empresa" className="w-full mb-2 p-2 bg-black rounded"
            value={form.empresa}
            onChange={e => setForm({ ...form, empresa: e.target.value })}
          />

          <input placeholder="Folio" className="w-full mb-2 p-2 bg-black rounded"
            value={form.numeroFactura}
            onChange={e => setForm({ ...form, numeroFactura: e.target.value })}
          />

          <input placeholder="Concepto" className="w-full mb-2 p-2 bg-black rounded"
            value={form.concepto}
            onChange={e => setForm({ ...form, concepto: e.target.value })}
          />

          <input placeholder="Total" className="w-full mb-4 p-2 bg-black rounded"
            value={form.monto}
            onChange={e => setForm({ ...form, monto: e.target.value })}
          />

          <button onClick={guardarCompra} className="w-full bg-blue-600 py-2 rounded">
            Guardar factura
          </button>
        </div>

        {/* TABLA */}
        <div className="lg:col-span-2 bg-[#111319] p-5 rounded-xl">
          <div className="flex gap-3 mb-3">
            <select onChange={e => setFiltroEmpresa(e.target.value)} className="bg-black p-2 rounded">
              <option value="">Todas las empresas</option>
              {[...new Set(compras.map(c => c.empresa))].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>

            <select onChange={e => setFiltroEstatus(e.target.value)} className="bg-black p-2 rounded">
              <option value="">Todos</option>
              <option value="CAPTURADA">CAPTURADA</option>
              <option value="APROBADA">APROBADA</option>
              <option value="PAGADA">PAGADA</option>
            </select>
          </div>

          <div className="overflow-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="text-green-300">
                <tr>
                  <th>Proveedor</th>
                  <th>Folio</th>
                  <th>Total</th>
                  <th>Estatus</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.map(c => (
                  <tr key={c.id} className="border-t border-white/10">
                    <td>{c.proveedor.nombre}</td>
                    <td>{c.numeroFactura}</td>
                    <td>${c.monto.toFixed(2)}</td>
                    <td>{c.estatus}</td>
                    <td className="flex gap-2">
                      {c.estatus !== "APROBADA" &&
                        <button onClick={() => cambiarEstatus(c.id, "APROBADA")} className="text-blue-400">Aprobar</button>}
                      {c.estatus !== "PAGADA" &&
                        <button onClick={() => cambiarEstatus(c.id, "PAGADA")} className="text-green-400">Pagar</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-6 text-sm">
            <div>Capturado: ${total("CAPTURADA").toFixed(2)}</div>
            <div>Aprobado: ${total("APROBADA").toFixed(2)}</div>
            <div>Pagado: ${total("PAGADA").toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
