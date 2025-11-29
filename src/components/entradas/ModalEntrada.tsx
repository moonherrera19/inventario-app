"use client";

import { useState, useTransition } from "react";

export default function EntradaModal({ open, onClose, onSuccess, productos }) {
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const registrarEntrada = async () => {
    if (!productoId) return alert("Selecciona un producto.");
    if (!cantidad || Number(cantidad) <= 0)
      return alert("Ingresa una cantidad válida.");

    startTransition(async () => {
      try {
        const res = await fetch("/api/entradas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productoId: Number(productoId),
            cantidad: Number(cantidad),
          }),
        });

        if (!res.ok) {
          alert("Error registrando entrada");
          return;
        }

        onSuccess();
        onClose();
      } catch (err) {
        console.error(err);
        alert("Error inesperado");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 px-4">
      <div className="bg-[#0f1a13] p-6 rounded-xl border border-green-800 shadow-xl w-full max-w-md">

        <h2 className="text-2xl font-bold text-green-400 mb-5 text-center">
          Registrar Entrada
        </h2>

        {/* SELECT DE PRODUCTO */}
        <label className="block mb-2 text-green-300 text-sm">Producto</label>
        <select
          className="w-full p-2 rounded-lg bg-[#142017] border border-green-800 text-white mb-4"
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
        >
          <option value="">Selecciona un producto...</option>

          {productos?.length > 0 ? (
            productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} (stock: {p.stock})
              </option>
            ))
          ) : (
            <option disabled>No hay productos</option>
          )}
        </select>

        {/* CANTIDAD */}
        <label className="block mb-2 text-green-300 text-sm">Cantidad</label>
        <input
          type="number"
          min="1"
          className="w-full p-2 rounded-lg bg-[#142017] border border-green-800 text-white mb-4"
          placeholder="Ej. 5"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />

        {/* BOTONES */}
        <div className="flex justify-between mt-6">
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className={`px-4 py-2 rounded-lg text-white transition-all ${
              isPending
                ? "bg-green-900/40 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={registrarEntrada}
            disabled={isPending}
          >
            {isPending ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
