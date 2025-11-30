"use client";

import { useEffect, useState, useTransition } from "react";

export default function ModalEntrada({
  open,
  onClose,
  onSuccess,   // 👉 YA ACEPTA onSuccess
  editData,
  productos = [],
}) {
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isPending, startTransition] = useTransition();

  // Si viene editData, rellenamos
  useEffect(() => {
    if (editData) {
      setProductoId(editData.productoId.toString());
      setCantidad(editData.cantidad.toString());
    }
  }, [editData]);

  const resetForm = () => {
    setProductoId("");
    setCantidad("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cantidadNum = Number(cantidad);
    if (!productoId) return setError("Debes seleccionar un producto.");
    if (!cantidadNum || cantidadNum <= 0)
      return setError("La cantidad debe ser mayor a 0.");

    startTransition(async () => {
      try {
        const res = await fetch("/api/entradas", {
          method: editData ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editData?.id,
            productoId: Number(productoId),
            cantidad: cantidadNum,
          }),
        });

        const data = await res.json();
        if (!res.ok) return setError(data.message || "Error al guardar.");

        setSuccess("Entrada registrada correctamente.");
        resetForm();

        setTimeout(() => {
          onSuccess(); // 👉 YA NOTIFICA A LA PÁGINA
          onClose();
        }, 900);
      } catch (error) {
        setError("Error inesperado.");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-[9999]">
      <div className="bg-[#0f1a13] border border-green-800 w-full max-w-md p-6 rounded-xl shadow-xl">

        <h2 className="text-2xl font-bold text-green-300 text-center mb-4">
          {editData ? "Editar Entrada" : "Registrar Entrada"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* PRODUCTO */}
          <div>
            <label className="text-sm text-green-200 mb-1 block">
              Producto
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white"
            >
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* CANTIDAD */}
          <div>
            <label className="text-sm text-green-200 mb-1 block">
              Cantidad
            </label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#142017] border border-green-700 text-white"
            />
          </div>

          {/* ERRORES */}
          {error && (
            <p className="text-red-400 text-center">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-center">{success}</p>
          )}

          {/* BOTONES */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className={`px-4 py-2 rounded-lg text-white transition-all ${
                isPending
                  ? "bg-green-900/40 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isPending ? "Guardando..." : "Guardar Entrada"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
