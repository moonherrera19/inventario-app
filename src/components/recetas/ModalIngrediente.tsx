"use client";

import { useState } from "react";

interface ModalIngredienteProps {
  open: boolean;
  onClose: () => void;
  productos: any[];
  ingredientesActuales: any[];
  onSave: (ingredientes: any[]) => void;   // 🔥 AGREGADO
}

export default function ModalIngrediente({
  open,
  onClose,
  productos,
  ingredientesActuales,
  onSave,   // 🔥 AGREGADO
}: ModalIngredienteProps) {
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");

  if (!open) return null;

  const agregar = () => {
    if (!productoId || !cantidad) {
      alert("Completa todos los campos");
      return;
    }

    const producto = productos.find((p) => p.id === Number(productoId));

    const nuevo = [
      ...ingredientesActuales,
      {
        producto,
        productoId: Number(productoId),
        cantidad: Number(cantidad),
      },
    ];

    onSave(nuevo); // 🔥 AHORA SÍ EXISTE
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-[#1a1f25] w-96 p-6 rounded-xl border border-green-700 shadow-xl">

        <h2 className="text-2xl text-green-400 mb-4 font-bold">Agregar Ingrediente</h2>

        {/* Producto */}
        <label className="text-gray-300 text-sm">Producto</label>
        <select
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          className="w-full bg-[#0f1217] border border-green-700 text-white p-2 rounded mb-4"
        >
          <option value="">Selecciona</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        {/* Cantidad */}
        <label className="text-gray-300 text-sm">Cantidad</label>
        <input
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          type="number"
          className="w-full bg-[#0f1217] border border-green-700 text-white p-2 rounded mb-4"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={agregar}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
