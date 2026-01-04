"use client";

import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPRESAS = ["H&C", "BERRIES BEST", "HACHERA", "4BERRIES"];
const MONEDAS = ["MXN", "USD"];

export default function ModalRegistrarFactura({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    proveedorId: "",
    numeroFactura: "",
    concepto: "",
    banco: "",
    cuentaClabe: "",
    empresa: "",
    moneda: "",
    monto: "",
    fechaFactura: "",
  });

  // ===============================
  // CARGAR PROVEEDORES
  // ===============================
  useEffect(() => {
    if (!open) return;

    fetch("/api/proveedores")
      .then(res => res.json())
      .then(data => setProveedores(Array.isArray(data) ? data : []))
      .catch(() => setProveedores([]));
  }, [open]);

  // ===============================
  // CAMBIO DE PROVEEDOR
  // ===============================
  const onProveedorChange = (id: string) => {
    setForm(prev => ({
      ...prev,
      proveedorId: id,
      moneda: "",
      banco: "",
      cuentaClabe: "",
    }));
  };

  // ===============================
  // CAMBIO DE MONEDA (AUTO BANCO / CUENTA)
  // ===============================
 // ===============================
// CAMBIO DE MONEDA (CORRECTO)
// ===============================
const onMonedaChange = (moneda: string) => {
  const proveedor = proveedores.find(
    p => p.id === Number(form.proveedorId)
  );

  if (!proveedor) return;

  const banco =
    moneda === "USD"
      ? proveedor.bancoDolares || ""
      : proveedor.banco || "";

  const cuenta =
    moneda === "USD"
      ? proveedor.clabeDolares || proveedor.numeroCuentaDolares || ""
      : proveedor.clabe || proveedor.numeroCuenta || "";

  setForm(prev => ({
    ...prev,
    moneda,
    banco,
    cuentaClabe: cuenta,
  }));
};


  if (!open) return null;

  // ===============================
  // GUARDAR FACTURA
  // ===============================
  const guardarFactura = async () => {
    if (!form.proveedorId || !form.empresa || !form.moneda || !form.monto) {
      alert("Proveedor, empresa, moneda y monto son obligatorios");
      return;
    }

    setLoading(true);

    const proveedor = proveedores.find(
      p => p.id === Number(form.proveedorId)
    );

    const res = await fetch("/api/compras-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: [
          {
            PROVEEDOR: proveedor?.nombre || "",
            FOLIO: form.numeroFactura,
            PRODUCTO: form.concepto,
            BANCO: form.banco,
            "CUENTA/CLABE": form.cuentaClabe,
            EMPRESA: form.empresa,
            MONEDA: form.moneda,
            TOTAL: form.monto,
            ESTATUS: "CAPTURADA",
          },
        ],
      }),
    });

    if (!res.ok) {
      alert("Error al guardar factura");
      setLoading(false);
      return;
    }

    onSuccess();
    onClose();

    setForm({
      proveedorId: "",
      numeroFactura: "",
      concepto: "",
      banco: "",
      cuentaClabe: "",
      empresa: "",
      moneda: "",
      monto: "",
      fechaFactura: "",
    });

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111319] p-6 rounded-xl w-full max-w-xl border border-white/10">
        <h2 className="text-xl font-bold mb-4 text-green-400">
          Registrar factura
        </h2>

        <div className="grid grid-cols-2 gap-3 text-sm">

          {/* PROVEEDOR */}
          <select
            className="bg-black p-2 rounded col-span-2"
            value={form.proveedorId}
            onChange={e => onProveedorChange(e.target.value)}
          >
            <option value="">Selecciona proveedor</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          {/* FOLIO */}
          <input
            placeholder="Folio"
            className="bg-black p-2 rounded"
            value={form.numeroFactura}
            onChange={e =>
              setForm({ ...form, numeroFactura: e.target.value })
            }
          />

          {/* EMPRESA */}
          <select
            className="bg-black p-2 rounded"
            value={form.empresa}
            onChange={e =>
              setForm({ ...form, empresa: e.target.value })
            }
          >
            <option value="">Selecciona empresa</option>
            {EMPRESAS.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          {/* MONEDA */}
          <select
            className="bg-black p-2 rounded"
            value={form.moneda}
            onChange={e => onMonedaChange(e.target.value)}
            disabled={!form.proveedorId}
          >
            <option value="">Moneda</option>
            {MONEDAS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* BANCO (AUTO) */}
          <input
            placeholder="Banco"
            className="bg-black p-2 rounded"
            value={form.banco}
            readOnly
          />

          {/* CUENTA / CLABE (AUTO) */}
          <input
            placeholder="Cuenta / CLABE"
            className="bg-black p-2 rounded"
            value={form.cuentaClabe}
            readOnly
          />

          {/* CONCEPTO */}
          <input
            placeholder="Producto / Concepto"
            className="bg-black p-2 rounded col-span-2"
            value={form.concepto}
            onChange={e =>
              setForm({ ...form, concepto: e.target.value })
            }
          />

          {/* MONTO */}
          <input
            type="number"
            placeholder="Monto"
            className="bg-black p-2 rounded"
            value={form.monto}
            onChange={e =>
              setForm({ ...form, monto: e.target.value })
            }
          />

          {/* FECHA */}
          <input
            type="date"
            className="bg-black p-2 rounded"
            value={form.fechaFactura}
            onChange={e =>
              setForm({ ...form, fechaFactura: e.target.value })
            }
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 px-4 py-2 rounded"
          >
            Cancelar
          </button>

          <button
            onClick={guardarFactura}
            disabled={loading}
            className="bg-green-600 px-4 py-2 rounded font-semibold"
          >
            {loading ? "Guardando..." : "Guardar factura"}
          </button>
        </div>
      </div>
    </div>
  );
}
