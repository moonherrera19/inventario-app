"use client";

import { useState } from "react";

export default function ModalIngrediente({
  open,
  onClose,
  productos,
  ingredientesActuales,
  onAddIngrediente,
}) {

  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");

  if (!open) return null;

  const handleAdd = () => {
    if (!productoId) return alert("Selecciona un producto");
    if (!cantidad || cantidad <= 0) return alert("Ingresa una cantidad válida");

    const producto = productos.find((p) => p.id === Number(productoId));

    onAddIngrediente({
      productoId: Number(productoId),
      cantidad: Number(cantidad),
      productoNombre: producto?.nombre || "",
    });

    setProductoId("");
    setCantidad("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] px-4">
      <div className="bg-[#102015] w-full max-w-md p-6 rounded-xl border border-green-700">

        <h2 className="text-xl font-bold text-green-300 mb-4 text-center">
          Añadir ingrediente
        </h2>

        {/* Select de productos */}
        <label className="text-sm text-green-200 mb-1 block">Producto</label>
        <select
          className="w-full bg-[#142017] border border-green-700 text-white p-2 rounded-lg mb-4"
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
        >
          <option value="">Selecciona un producto...</option>

          {productos.length > 0 ? (
            productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))
          ) : (
            <option disabled>No hay productos cargados</option>
          )}
        </select>

        {/* Cantidad */}
        <label className="text-sm text-green-200 mb-1 block">Cantidad</label>
        <input
          type="number"
          className="w-full bg-[#142017] border border-green-700 text-white p-2 rounded-lg"
          placeholder="Ej. 2"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />

        {/* Botones */}
        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
