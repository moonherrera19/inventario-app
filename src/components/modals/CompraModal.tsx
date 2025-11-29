"use client";

import { useState, useTransition } from "react";

export default function ModalCompra({ open, onClose, productos = [], proveedores = [] }) {
  const [productoId, setProductoId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setProductoId("");
    setProveedorId("");
    setCantidad("");
    setCosto("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cantidadNum = Number(cantidad);
    const costoNum = Number(costo);

    // VALIDACIONES
    if (!productoId) return setError("Debes seleccionar un producto.");
    if (!proveedorId) return setError("Debes seleccionar un proveedor.");
    if (!cantidadNum || cantidadNum <= 0)
      return setError("La cantidad debe ser mayor a 0.");
    if (!costoNum || costoNum <= 0)
      return setError("El costo total debe ser mayor a 0.");

    startTransition(async () => {
      try {
        const res = await fetch("/api/compras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productoId,
            proveedorId,
            cantidad: cantidadNum,
            costo: costoNum,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          return setError(data.message || "Error al registrar la compra.");
        }

        setSuccess("Compra registrada correctamente.");
        resetForm();

        setTimeout(() => {
          onClose();
        }, 1000);
      } catch (err) {
        setError("Error inesperado. Intenta nuevamente.");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4">
      <div className="bg-[#0f1a13] border border-green-800 w-full max-w-md p-6 rounded-xl shadow-2xl">

        {/* TITULO */}
        <h2 className="text-2xl font-bold text-green-300 mb-4 text-center">
          Registrar Compra
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* SELECT PRODUCTO */}
          <div>
            <label className="text-sm text-green-200 mb-1 block">
              Producto
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white focus:outline-none"
            >
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* SELECT PROVEEDOR */}
          <div>
            <label className="text-sm text-green-200 mb-1 block">
              Proveedor
            </label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white focus:outline-none"
            >
              <option value="">Selecciona un proveedor</option>
              {proveedores.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.nombre}
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
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white focus:outline-none"
            />
          </div>

          {/* COSTO */}
          <div>
            <label className="text-sm text-green-200 mb-1 block">
              Costo total ($)
            </label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white focus:outline-none"
            />
          </div>

          {/* MENSAJES */}
          {error && (
            <p className="text-red-400 text-sm text-center font-medium">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-400 text-sm text-center font-medium">
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
                !proveedorId ||
                !cantidad ||
                Number(cantidad) <= 0 ||
                !costo ||
                Number(costo) <= 0
              }
              className={`px-4 py-2 rounded-lg text-white transition-all ${
                isPending ||
                !productoId ||
                !proveedorId ||
                !cantidad ||
                Number(cantidad) <= 0 ||
                !costo ||
                Number(costo) <= 0
                  ? "bg-green-900/40 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isPending ? "Guardando..." : "Registrar Compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
