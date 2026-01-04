"use client";

import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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
    moneda: "MXN",
    monto: "",
    fechaFactura: "",
  });

  // 🔥 cargar proveedores reales
  useEffect(() => {
    if (!open) return;

    fetch("/api/proveedores")
      .then(res => res.json())
      .then(data => setProveedores(data || []));
  }, [open]);

  if (!open) return null;

  const guardarFactura = async () => {
    setLoading(true);

    const res = await fetch("/api/compras-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: [
          {
            PROVEEDOR: proveedores.find(p => p.id === Number(form.proveedorId))
              ?.nombre,
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
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111319] p-6 rounded-xl w-full max-w-xl border border-white/10">
        <h2 className="text-xl font-bold mb-4 text-green-400">
          Registrar factura
        </h2>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <select
            className="bg-black p-2 rounded col-span-2"
            value={form.proveedorId}
            onChange={e =>
              setForm({ ...form, proveedorId: e.target.value })
            }
          >
            <option value="">Selecciona proveedor</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <input
            placeholder="Folio"
            className="bg-black p-2 rounded"
            value={form.numeroFactura}
            onChange={e =>
              setForm({ ...form, numeroFactura: e.target.value })
            }
          />

          <input
            placeholder="Empresa"
            className="bg-black p-2 rounded"
            value={form.empresa}
            onChange={e =>
              setForm({ ...form, empresa: e.target.value })
            }
          />

          <input
            placeholder="Banco"
            className="bg-black p-2 rounded"
            value={form.banco}
            onChange={e => setForm({ ...form, banco: e.target.value })}
          />

          <input
            placeholder="Cuenta / CLABE"
            className="bg-black p-2 rounded"
            value={form.cuentaClabe}
            onChange={e =>
              setForm({ ...form, cuentaClabe: e.target.value })
            }
          />

          <input
            placeholder="Producto / Concepto"
            className="bg-black p-2 rounded col-span-2"
            value={form.concepto}
            onChange={e =>
              setForm({ ...form, concepto: e.target.value })
            }
          />

          <input
            placeholder="Monto"
            type="number"
            className="bg-black p-2 rounded"
            value={form.monto}
            onChange={e => setForm({ ...form, monto: e.target.value })}
          />

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
