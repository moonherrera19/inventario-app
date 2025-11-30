"use client";

import { useState, useTransition } from "react";

interface ModalSalidaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  productos: any[];
}

export default function ModalSalida({
  open,
  onClose,
  onSuccess,
  productos,
}: ModalSalidaProps) {
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const guardar = () => {
    if (!productoId || !cantidad) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    startTransition(async () => {
      setError("");

      const res = await fetch("/api/salidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: Number(productoId),
          cantidad: Number(cantidad),
        }),
      });

      if (!res.ok) {
        setError("Error guardando la salida.");
        return;
      }

      onSuccess();
      onClose();
      setProductoId("");
      setCantidad("");
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-40">
      <div className="bg-[#1a1f25] w-96 p-6 rounded-xl border border-blue-700 shadow-xl">
        <h2 className="text-2xl font-bold text-blue-400 mb-4">Nueva Salida</h2>

        {/* Producto */}
        <label className="text-sm text-gray-300">Producto</label>
        <select
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          className="w-full px-3 py-2 mb-3 bg-[#0f1217] border border-blue-700 rounded text-white"
        >
          <option value="">Selecciona...</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        {/* Cantidad */}
        <label className="text-sm text-gray-300">Cantidad</label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-full px-3 py-2 mb-3 bg-[#0f1217] border border-blue-700 rounded text-white"
        />

        {/* Error */}
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-3">
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
