"use client";

import { useEffect, useState } from "react";

type Compra = {
  id: number;
  numeroFactura?: string;
  banco?: string;
  empresa?: string;
  concepto: string;
  monto: number;
  estatus: "CAPTURADA" | "APROBADA" | "PAGADA";
  fechaFactura?: string;
  fechaPago?: string;
  proveedor: {
    nombre: string;
  };
};

export default function ComprasAdminPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({
    proveedorId: "",
    numeroFactura: "",
    banco: "",
    cuentaClabe: "",
    empresa: "",
    moneda: "MXN",
    concepto: "",
    precio: "",
    monto: "",
    fechaFactura: "",
  });

  // ===============================
  // Cargar compras
  // ===============================
  const fetchCompras = async () => {
    const res = await fetch("/api/compras-admin");
    const data = await res.json();
    setCompras(data.compras);
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  // ===============================
  // Crear compra manual
  // ===============================
  const submitForm = async () => {
    setLoading(true);
    await fetch("/api/compras-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        proveedorId: Number(form.proveedorId),
        monto: Number(form.monto),
        precio: form.precio ? Number(form.precio) : null,
      }),
    });
    setLoading(false);
    setForm({
      proveedorId: "",
      numeroFactura: "",
      banco: "",
      cuentaClabe: "",
      empresa: "",
      moneda: "MXN",
      concepto: "",
      precio: "",
      monto: "",
      fechaFactura: "",
    });
    fetchCompras();
  };

  // ===============================
  // Importar Excel
  // ===============================
  const importExcel = async () => {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);

    await fetch("/api/compras-admin", {
      method: "POST",
      body: fd,
    });

    setFile(null);
    setLoading(false);
    fetchCompras();
  };

  // ===============================
  // Cambiar estatus
  // ===============================
  const changeStatus = async (id: number, estatus: string) => {
    await fetch(`/api/compras-admin?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatus }),
    });
    fetchCompras();
  };

  // ===============================
  // Totales
  // ===============================
  const totalByStatus = (estatus: string) =>
    compras
      .filter((c) => c.estatus === estatus)
      .reduce((sum, c) => sum + c.monto, 0);

  return (
    <div className="p-6 text-white bg-[#0f1217] min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Compras Administrativas</h1>

      {/* IMPORTAR EXCEL */}
      <div className="mb-6 flex items-center gap-3">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={importExcel}
          className="px-4 py-2 bg-green-600 rounded"
        >
          Importar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FORMULARIO */}
        <div className="bg-[#111319] p-4 rounded">
          <h2 className="font-semibold mb-3">Registrar factura</h2>

          {[
            ["Proveedor ID", "proveedorId"],
            ["Folio", "numeroFactura"],
            ["Banco", "banco"],
            ["Cuenta / Clabe", "cuentaClabe"],
            ["Empresa", "empresa"],
            ["Concepto", "concepto"],
            ["Precio", "precio"],
            ["Total", "monto"],
          ].map(([label, key]) => (
            <input
              key={key}
              placeholder={label}
              className="w-full mb-2 p-2 bg-black border border-white/10 rounded"
              value={form[key]}
              onChange={(e) =>
                setForm({ ...form, [key]: e.target.value })
              }
            />
          ))}

          <input
            type="date"
            className="w-full mb-2 p-2 bg-black border border-white/10 rounded"
            value={form.fechaFactura}
            onChange={(e) =>
              setForm({ ...form, fechaFactura: e.target.value })
            }
          />

          <button
            onClick={submitForm}
            disabled={loading}
            className="w-full bg-blue-600 py-2 rounded mt-2"
          >
            Guardar factura
          </button>
        </div>

        {/* TABLA */}
        <div className="md:col-span-2 bg-[#111319] p-4 rounded">
          <h2 className="font-semibold mb-3">Facturas</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th>Folio</th>
                <th>Proveedor</th>
                <th>Total</th>
                <th>Estatus</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  <td>{c.numeroFactura}</td>
                  <td>{c.proveedor?.nombre}</td>
                  <td>${c.monto.toFixed(2)}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        c.estatus === "CAPTURADA"
                          ? "bg-yellow-600"
                          : c.estatus === "APROBADA"
                          ? "bg-blue-600"
                          : "bg-green-600"
                      }`}
                    >
                      {c.estatus}
                    </span>
                  </td>
                  <td className="flex gap-1 py-1">
                    {c.estatus !== "APROBADA" && (
                      <button
                        onClick={() => changeStatus(c.id, "APROBADA")}
                        className="text-blue-400"
                      >
                        Aprobar
                      </button>
                    )}
                    {c.estatus !== "PAGADA" && (
                      <button
                        onClick={() => changeStatus(c.id, "PAGADA")}
                        className="text-green-400"
                      >
                        Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTALES */}
      <div className="mt-6 flex gap-6">
        <div>Capturado: ${totalByStatus("CAPTURADA").toFixed(2)}</div>
        <div>Aprobado: ${totalByStatus("APROBADA").toFixed(2)}</div>
        <div>Pagado: ${totalByStatus("PAGADA").toFixed(2)}</div>
      </div>
    </div>
  );
}
