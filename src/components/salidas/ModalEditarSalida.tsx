"use client";

import { useState, useTransition, useEffect } from "react";

// ============================
// TIPADO DE PROPS
// ============================
interface ModalEditarSalidaProps {
  open: boolean;
  onClose: () => void;
  data: any;
  refresh: () => void;
}

export default function ModalEditarSalida({
  open,
  onClose,
  data,
  refresh,
}: ModalEditarSalidaProps) {
  
  // Estados
  const [cantidad, setCantidad] = useState("");
  const [rancho, setRancho] = useState("");
  const [cultivo, setCultivo] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // ============================
  // CARGAR DATA AL ABRIR MODAL
  // ============================
  useEffect(() => {
    if (data && open) {
      setCantidad(String(data.cantidad ?? ""));
      setRancho(data.rancho ?? "");
      setCultivo(data.cultivo ?? "");
    }
  }, [data, open]);

  // ============================
  // GUARDAR CAMBIOS
  // ============================
  const guardar = async () => {
    if (!cantidad) {
      setError("La cantidad es obligatoria.");
      return;
    }

    startTransition(async () => {
      setError("");

      const res = await fetch("/api/salidas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.id,
          cantidad: Number(cantidad),
          rancho: rancho || null,
          cultivo: cultivo || null,
        }),
      });

      if (!res.ok) {
        const info = await res.json();
        setError(info.error || "Error actualizando salida.");
        return;
      }

      refresh();
      onClose();
    });
  };

  // ============================
  // NO RENDERIZAR SIN OPEN O DATA
  // ============================
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-[#1a1f25] w-96 p-6 rounded-xl border border-blue-700 shadow-xl">

        <h2 className="text-2xl font-bold text-blue-400 mb-4">Editar Salida</h2>

        {/* Cantidad */}
        <label className="text-sm text-gray-300">Cantidad</label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-full px-3 py-2 mb-3 bg-[#0f1217] border border-blue-700 text-white rounded"
        />

        {/* Rancho */}
        <label className="text-sm text-gray-300">Rancho</label>
        <input
          type="text"
          value={rancho}
          onChange={(e) => setRancho(e.target.value)}
          className="w-full px-3 py-2 mb-3 bg-[#0f1217] border border-blue-700 text-white rounded"
        />

        {/* Cultivo */}
        <label className="text-sm text-gray-300">Cultivo</label>
        <input
          type="text"
          value={cultivo}
          onChange={(e) => setCultivo(e.target.value)}
          className="w-full px-3 py-2 mb-3 bg-[#0f1217] border border-blue-700 text-white rounded"
        />

        {/* Error */}
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-3 mt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={guardar}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
