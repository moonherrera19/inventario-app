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
  const [items, setItems] = useState([
    { productoId: "", cantidad: "" },
  ]);

  const [fecha, setFecha] = useState("");
  const [rancho, setRancho] = useState("");
  const [cultivo, setCultivo] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // ➕ Agregar producto
  const agregarItem = () => {
    setItems([...items, { productoId: "", cantidad: "" }]);
  };

  // ❌ Eliminar producto
  const eliminarItem = (index: number) => {
    const nuevos = items.filter((_, i) => i !== index);
    setItems(nuevos);
  };

  // ✏️ Actualizar item
  const actualizarItem = (index: number, campo: string, valor: any) => {
    const nuevos = [...items];
    nuevos[index][campo] = valor;
    setItems(nuevos);
  };

  const guardar = () => {
    if (items.some((i) => !i.productoId || !i.cantidad)) {
      setError("Todos los productos deben tener cantidad.");
      return;
    }

    startTransition(async () => {
      setError("");

      const res = await fetch("/api/salidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha || null,
          rancho: rancho || null,
          cultivo: cultivo || null,
          items: items.map((i) => ({
            productoId: Number(i.productoId),
            cantidad: Number(i.cantidad),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error guardando la salida.");
        return;
      }

      onSuccess();
      onClose();

      // limpiar
      setItems([{ productoId: "", cantidad: "" }]);
      setFecha("");
      setRancho("");
      setCultivo("");
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-40">
      <div className="bg-[#1a1f25] w-[500px] max-h-[90vh] overflow-y-auto p-6 rounded-xl border border-blue-700 shadow-xl">

        <h2 className="text-2xl font-bold text-blue-400 mb-4">
          Nueva Salida
        </h2>

        {/* FECHA */}
        <label className="text-sm text-gray-300">Fecha</label>
        <input
          type="datetime-local"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full px-3 py-2 mb-3 bg-[#0f1217] border border-blue-700 rounded text-white"
        />

        {/* PRODUCTOS DINÁMICOS */}
        <label className="text-sm text-gray-300 mb-2 block">
          Productos
        </label>

        {items.map((item, i) => (
          <div key={i} className="flex gap-2 mb-2">

            <select
              value={item.productoId}
              onChange={(e) =>
                actualizarItem(i, "productoId", e.target.value)
              }
              className="flex-1 px-2 py-2 bg-[#0f1217] border border-blue-700 rounded text-white"
            >
              <option value="">Producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Cant."
              value={item.cantidad}
              onChange={(e) =>
                actualizarItem(i, "cantidad", e.target.value)
              }
              className="w-24 px-2 py-2 bg-[#0f1217] border border-blue-700 rounded text-white"
            />

            {items.length > 1 && (
              <button
                onClick={() => eliminarItem(i)}
                className="bg-red-600 px-2 rounded"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          onClick={agregarItem}
          className="mb-3 bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
        >
          + Agregar producto
        </button>

        {/* Rancho */}
        <label className="text-sm text-gray-300">Rancho</label>
        <input
          type="text"
          value={rancho}
          onChange={(e) => setRancho(e.target.value)}
          className="w-full px-3 py-2 mb-3 bg-[#0f1217] border border-blue-700 rounded text-white"
        />

        {/* Cultivo */}
        <label className="text-sm text-gray-300">Cultivo</label>
        <input
          type="text"
          value={cultivo}
          onChange={(e) => setCultivo(e.target.value)}
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
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}