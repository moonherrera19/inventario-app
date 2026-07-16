"use client";

import { useState } from "react";

interface ModalEditarFechaSalidaProps {
  open: boolean;
  onClose: () => void;
  salidaId: number;
  fechaActual: string;
  refresh: () => void;
}

export default function ModalEditarFechaSalida({
  open,
  onClose,
  salidaId,
  fechaActual,
  refresh,
}: ModalEditarFechaSalidaProps) {
  // Convertimos la fecha actual a formato yyyy-MM-dd para el input date
  const [fecha, setFecha] = useState(() => {
    const d = new Date(fechaActual);
    return d.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const guardar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/salidas/${salidaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar la fecha");
      }

      refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al actualizar la fecha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#0f1217] border border-gray-700 rounded-lg p-6 w-full max-w-sm text-white">
        <h2 className="text-lg font-semibold mb-4">Editar fecha</h2>

        <label className="block text-sm text-gray-300 mb-1">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1217] border border-blue-700 rounded text-white mb-4"
        />

        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 font-medium"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}