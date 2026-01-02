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
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({
    proveedorId: "",
    banco: "",
    cuentaClabe: "",
    moneda: "MXN",
    numeroFactura: "",
    concepto: "",
    monto: "",
    fechaFactura: "",
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
  // SELECT PROVEEDOR → AUTOFILL
  // ===============================
  const onSelectProveedor = (id: number) => {
    const prov = proveedores.find(p => p.id === id);
    if (!prov) return;

    if (form.moneda === "USD") {
      setForm({
        ...form,
        proveedorId: id,
        banco: prov.bancoDolares || "",
        cuentaClabe: prov.numeroCuentaDolares || prov.clabeDolares || "",
      });
    } else {
      setForm({
        ...form,
        proveedorId: id,
        banco: prov.banco || "",
        cuentaClabe: prov.numeroCuenta || prov.clabe || "",
      });
    }
  };

  // ===============================
  // CREAR COMPRA
  // ===============================
  const guardarCompra = async () => {
    setLoading(true);
    await fetch("/api/compras-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        proveedorId: Number(form.proveedorId),
        monto: Number(form.monto),
      }),
    });
    setLoading(false);
    setForm({
      proveedorId: "",
      banco: "",
      cuentaClabe: "",
      moneda: "MXN",
      numeroFactura: "",
      concepto: "",
      monto: "",
      fechaFactura: "",
    });
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
  // TOTALES
  // ===============================
  const total = (e: string) =>
    compras.filter(c => c.estatus === e).reduce((s, c) => s + c.monto, 0);

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">
      <h1 className="text-3xl font-bold text-green-400 mb-6">
        Compras Administrativas
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORMULARIO */}
        <div className="bg-[#111319] p-5 rounded-xl border border-white/10">
          <h2 className="font-semibold mb-4">Registrar factura</h2>

          <select
            className="w-full mb-2 p-2 bg-black rounded"
            value={form.proveedorId}
            onChange={(e) => onSelectProveedor(Number(e.target.value))}
          >
            <option value="">Selecciona proveedor</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          <select
            className="w-full mb-2 p-2 bg-black rounded"
            value={form.moneda}
            onChange={(e) => setForm({ ...form, moneda: e.target.value })}
          >
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>

          <input disabled value={form.banco} className="w-full mb-2 p-2 bg-black rounded" />
          <input disabled value={form.cuentaClabe} className="w-full mb-2 p-2 bg-black rounded" />

          <input placeholder="Folio" className="w-full mb-2 p-2 bg-black rounded"
            value={form.numeroFactura}
            onChange={(e) => setForm({ ...form, numeroFactura: e.target.value })}
          />

          <input placeholder="Concepto" className="w-full mb-2 p-2 bg-black rounded"
            value={form.concepto}
            onChange={(e) => setForm({ ...form, concepto: e.target.value })}
          />

          <input placeholder="Total" className="w-full mb-2 p-2 bg-black rounded"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
          />

          <input type="date" className="w-full mb-3 p-2 bg-black rounded"
            value={form.fechaFactura}
            onChange={(e) => setForm({ ...form, fechaFactura: e.target.value })}
          />

          <button
            onClick={guardarCompra}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 py-2 rounded"
          >
            Guardar factura
          </button>
        </div>

        {/* TABLA */}
        <div className="lg:col-span-2 bg-[#111319] p-5 rounded-xl border border-white/10">
          <h2 className="font-semibold mb-3">Facturas</h2>

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
                {compras.map(c => (
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
