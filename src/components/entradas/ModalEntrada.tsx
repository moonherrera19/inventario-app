"use client";

import { useState, useTransition, useMemo } from "react";

interface Producto {
  id: number;
  nombre: string;
  unidad: string;
  manejaLotes: boolean;
}

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
  productos: Producto[];
}

export default function ModalEntrada({
  open,
  onClose,
  onSuccess,
  editData,
  productos,
}: ModalEntradaProps) {

  const [productoId, setProductoId] = useState<number | "">(
    editData?.productoId || ""
  );
  const [cantidad, setCantidad] = useState<number | "">(
    editData?.cantidad || ""
  );
  const [loteCodigo, setLoteCodigo] = useState("");
  const [fechaCaducidad, setFechaCaducidad] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // 🧠 Producto seleccionado completo
  const productoSeleccionado = useMemo(
    () => productos.find(p => p.id === Number(productoId)),
    [productoId, productos]
  );

  const resetForm = () => {
    setProductoId("");
    setCantidad("");
    setLoteCodigo("");
    setFechaCaducidad("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!productoSeleccionado) {
      return setError("Selecciona un producto.");
    }

    if (!cantidad || Number(cantidad) <= 0) {
      return setError("La cantidad debe ser mayor a 0.");
    }

    // 🔴 SOLO validar lote si el producto maneja lotes
    if (productoSeleccionado.manejaLotes && !loteCodigo) {
      return setError("El código de lote es obligatorio para este producto.");
    }

    const payload: any = {
      productoId: productoSeleccionado.id,
      cantidad: Number(cantidad),
    };

    if (productoSeleccionado.manejaLotes) {
      payload.loteCodigo = loteCodigo;
      payload.fechaCaducidad = fechaCaducidad || null;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/entradas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al guardar la entrada.");
          return;
        }

        onSuccess();
        resetForm();
        onClose();

      } catch {
        setError("Error inesperado, intenta de nuevo.");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-[#0f1a13] border border-green-800 w-full max-w-md p-6 rounded-xl shadow-xl">

        <h2 className="text-2xl font-bold text-green-300 mb-4 text-center">
          Registrar Entrada
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* PRODUCTO */}
          <div>
            <label className="block text-sm text-green-200 mb-1">
              Producto
            </label>
            <select
              value={productoId}
              onChange={(e) => {
                setProductoId(Number(e.target.value));
                setLoteCodigo("");
                setFechaCaducidad("");
                setError("");
              }}
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
            <label className="block text-sm text-green-200 mb-1">
              Cantidad a ingresar
            </label>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white"
            />
          </div>

          {/* 🔵 LOTE Y CADUCIDAD — SOLO SI MANEJA LOTES */}
          {productoSeleccionado?.manejaLotes && (
            <>
              <div>
                <label className="block text-sm text-green-200 mb-1">
                  Código de lote
                </label>
                <input
                  type="text"
                  value={loteCodigo}
                  onChange={(e) => setLoteCodigo(e.target.value)}
                  placeholder="Ej. FERT-0925"
                  className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-green-200 mb-1">
                  Fecha de caducidad (opcional)
                </label>
                <input
                  type="date"
                  value={fechaCaducidad}
                  onChange={(e) => setFechaCaducidad(e.target.value)}
                  className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white"
                />
              </div>
            </>
          )}

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
              {isPending ? "Guardando..." : "Registrar"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
