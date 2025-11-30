"use client";

import { useState, useTransition } from "react";

// Tipado de props
interface ModalEntradaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: {
    id: number;
    productoId: number;
    cantidad: number;
    fecha: string;
  } | null;
  productos: {
    id: number;
    nombre: string;
    unidad: string;
  }[];
}

export default function ModalEntrada({
  open,
  onClose,
  onSuccess,
  editData,
  productos,
}: ModalEntradaProps) {

  const [productoId, setProductoId] = useState(editData?.productoId || "");
  const [cantidad, setCantidad] = useState(editData?.cantidad || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const resetForm = () => {
    setProductoId("");
    setCantidad("");
    setError("");
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!productoId) return setError("Selecciona un producto.");
    if (!cantidad || Number(cantidad) <= 0)
      return setError("La cantidad debe ser mayor a 0.");

    startTransition(async () => {
      try {
        const res = await fetch("/api/entradas", {
          method: editData ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editData?.id,
            productoId: Number(productoId),
            cantidad: Number(cantidad),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Error al guardar la entrada.");
          return;
        }

        onSuccess();
        resetForm();
        onClose();
      } catch (err) {
        setError("Error inesperado, intenta de nuevo.");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-[#0f1a13] border border-green-800 w-full max-w-md p-6 rounded-xl shadow-xl">

        <h2 className="text-2xl font-bold text-green-300 mb-4 text-center">
          {editData ? "Editar Entrada" : "Registrar Entrada"}
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
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white"
            >
              <option value="">Selecciona un producto</option>

              {productos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* CANTIDAD */}
          <div>
            <label className="block text-sm text-green-200 mb-1">
              Cantidad a ingresar
            </label>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white"
            />
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-red-400 text-center text-sm font-medium">
              {error}
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
              disabled={isPending}
              className={`px-4 py-2 rounded-lg text-white transition-all ${
                isPending
                  ? "bg-green-900/40 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isPending ? "Guardando..." : editData ? "Guardar" : "Registrar"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
