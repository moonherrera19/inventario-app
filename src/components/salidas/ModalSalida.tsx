"use client";

import { useState, useTransition } from "react";

export default function ModalSalida({ open, onClose, productos }) {
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setProductoId("");
    setCantidad("");
    setError("");
    setSuccess("");
  };

  // Stock disponible: corregido (string → number)
  const stockDisponible = productoId
    ? productos.find((p) => p.id === Number(productoId))?.stock || 0
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cantidadNum = Number(cantidad);

    // VALIDACIONES
    if (!productoId) return setError("Selecciona un producto.");
    if (!cantidad || cantidadNum <= 0)
      return setError("La cantidad debe ser mayor a 0.");
    if (cantidadNum > stockDisponible)
      return setError("La cantidad excede el stock disponible.");

    startTransition(async () => {
      try {
        const res = await fetch("/api/salidas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productoId: Number(productoId), // ✔ CORREGIDO
            cantidad: cantidadNum,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          return setError(data.message || "Error al registrar salida.");
        }

        setSuccess("Salida registrada correctamente.");
        resetForm();

        setTimeout(() => {
          onClose();
        }, 1100);
      } catch (err) {
        setError("Error inesperado. Intenta nuevamente.");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-[#0f1a13] border border-green-800 w-full max-w-md p-6 rounded-xl shadow-xl">

        {/* TÍTULO */}
        <h2 className="text-2xl font-bold text-green-300 mb-4 text-center">
          Registrar Salida
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* PRODUCTO */}
          <div>
            <label className="block text-sm text-green-200 mb-1">
              Producto
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className={`w-full rounded-lg p-2 bg-[#142017] border ${
                error && !productoId ? "border-red-500" : "border-green-700"
              } text-white`}
            >
              <option value="">Selecciona un producto</option>

              {productos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>

          {/* CANTIDAD */}
          <div>
            <label className="block text-sm text-green-200 mb-1">
              Cantidad a sacar
            </label>
            <input
              type="number"
              value={cantidad}
              min={1}
              onChange={(e) => setCantidad(e.target.value)}
              className={`w-full rounded-lg p-2 bg-[#142017] border ${
                error && Number(cantidad) > stockDisponible
                  ? "border-red-500"
                  : "border-green-700"
              } text-white`}
            />

            {productoId && (
              <p className="text-xs text-green-400 mt-1">
                Stock disponible: {stockDisponible}
              </p>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-red-400 text-center text-sm font-medium">
              {error}
            </p>
          )}

          {/* SUCCESS */}
          {success && (
            <p className="text-green-400 text-center text-sm font-medium">
              {success}
            </p>
          )}

          {/* BOTONES */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isPending ||
                !productoId ||
                !cantidad ||
                Number(cantidad) <= 0 ||
                Number(cantidad) > stockDisponible
              }
              className={`px-4 py-2 rounded-lg text-white transition-all ${
                isPending ||
                !productoId ||
                !cantidad ||
                Number(cantidad) <= 0 ||
                Number(cantidad) > stockDisponible
                  ? "bg-green-900/40 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isPending ? "Guardando..." : "Registrar Salida"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
