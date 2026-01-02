"use client";

import { useState, useTransition, useEffect } from "react";

// ============================
// TIPADO
// ============================
interface ModalEditarSalidaProps {
  open: boolean;
  onClose: () => void;
  data: {
    id: number;
    cantidad: number;
    rancho?: string | null;
    cultivo?: string | null;
  } | null;
  refresh: () => void;
}

export default function ModalEditarSalida({
  open,
  onClose,
  data,
  refresh,
}: ModalEditarSalidaProps) {

  const [cantidad, setCantidad] = useState<number | "">("");
  const [rancho, setRancho] = useState("");
  const [cultivo, setCultivo] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // ============================
  // CARGAR DATA AL ABRIR
  // ============================
  useEffect(() => {
    if (data && open) {
      setCantidad(data.cantidad ?? "");
      setRancho(data.rancho ?? "");
      setCultivo(data.cultivo ?? "");
      setError("");
    }
  }, [data, open]);

  // ============================
  // GUARDAR CAMBIOS
  // ⚠️ NO MODIFICA INVENTARIO
  // ============================
  const guardar = () => {
    if (!cantidad || Number(cantidad) <= 0) {
      setError("La cantidad debe ser mayor a 0.");
      return;
    }

    startTransition(async () => {
      setError("");

      try {
        const res = await fetch("/api/salidas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data?.id,
            cantidad: Number(cantidad),
            rancho: rancho || null,
            cultivo: cultivo || null,
          }),
        });

        const info = await res.json();

        if (!res.ok) {
          setError(info.error || "Error al actualizar la salida.");
          return;
        }

        refresh();
        onClose();

      } catch {
        setError("Error inesperado. Intenta de nuevo.");
      }
    });
  };

  // ============================
  // NO RENDERIZAR
  // ============================
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-[#1a1f25] w-full max-w-sm p-6 rounded-xl border border-blue-700 shadow-xl">

        <h2 className="text-2xl font-bold text-blue-400 mb-2">
          Editar Salida
        </h2>

        <p className="text-xs text-gray-400 mb-4">
          ⚠️ Editar esta información no modifica el inventario.
        </p>

        {/* Cantidad */}
        <label className="text-sm text-gray-300">Cantidad</label>
        <input
          type="number"
          min={1}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
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
        {error && (
          <p className="text-red-400 text-sm mb-2 text-center">
            {error}
          </p>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
          >
            Cancelar
          </button>

          <button
            onClick={guardar}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg text-white transition ${
              isPending
                ? "bg-blue-900/40 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
