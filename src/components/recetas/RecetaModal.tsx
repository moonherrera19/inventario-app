"use client";

import { useEffect, useState, useTransition } from "react";
import ModalIngrediente from "@/components/recetas/ModalIngrediente";


export default function RecetaModal({ open, onClose, refresh, editData, productos }) {
  const [nombre, setNombre] = useState("");
  const [ingredientes, setIngredientes] = useState([]);
  const [openIng, setOpenIng] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isPending, startTransition] = useTransition();

  // ======================================================
  // CARGAR DATOS EN MODO EDICIÓN
  // ======================================================
  useEffect(() => {
    if (editData) {
      setNombre(editData.nombre);

      setIngredientes(
        editData.ingredientes.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          productoNombre: i.producto.nombre,
        }))
      );
    } else {
      setNombre("");
      setIngredientes([]);
    }
  }, [editData]);

  // ======================================================
  // AÑADIR INGREDIENTE
  // ======================================================
  const handleAddIngrediente = (ing) => {
    setIngredientes((prev) => [...prev, ing]);
  };

  // ======================================================
  // BORRAR INGREDIENTE
  // ======================================================
  const removeIngrediente = (index) => {
    setIngredientes((prev) => prev.filter((_, i) => i !== index));
  };

  // ======================================================
  // GUARDAR RECETA
  // ======================================================
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (ingredientes.length === 0) return setError("Agrega al menos un ingrediente.");

    const payload = {
      nombre,
      ingredientes: ingredientes.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
      })),
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/recetas", {
          method: editData ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData ? { id: editData.id, ...payload } : payload),
        });

        const data = await res.json();
        if (!res.ok) return setError(data.error || "Error al guardar receta.");

        setSuccess(editData ? "Receta actualizada." : "Receta creada.");

        setTimeout(() => {
          refresh();
          onClose();
        }, 1200);
      } catch (err) {
        setError("Error inesperado.");
      }
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Modal secundario para ingredientes */}
      <ModalIngrediente
        open={openIng}
        onClose={() => setOpenIng(false)}
        productos={productos}
        ingredientesActuales={ingredientes}
        onAddIngrediente={handleAddIngrediente}
      />

      {/* Modal principal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4">
        <div className="bg-[#0f1a13] border border-green-800 w-full max-w-lg p-6 rounded-xl shadow-xl">

          {/* Título */}
          <h2 className="text-3xl font-bold text-green-300 mb-4 text-center">
            {editData ? "Editar Receta" : "Crear Receta"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nombre */}
            <div>
              <label className="text-sm text-green-200 mb-1 block">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-[#142017] border border-green-700 text-white p-2 rounded-lg"
                placeholder="Ej. Mezcla foliar"
              />
            </div>

            {/* Ingredientes */}
            <div>
              <label className="text-sm text-green-200 mb-2 block">
                Ingredientes
              </label>

              {ingredientes.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin ingredientes.</p>
              ) : (
                <ul className="space-y-2">
                  {ingredientes.map((ing, i) => (
                    <li
                      key={i}
                      className="bg-[#142017] border border-green-700 rounded-lg p-2 text-white flex justify-between items-center"
                    >
                      <span>
                        {ing.productoNombre} — {ing.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeIngrediente(i)}
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
                      >
                        eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Botón agregar ingrediente */}
              <button
                type="button"
                onClick={() => setOpenIng(true)}
                className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
              >
                + Añadir ingrediente
              </button>
            </div>

            {/* Mensajes */}
            {error && <p className="text-red-400 text-center">{error}</p>}
            {success && <p className="text-green-400 text-center">{success}</p>}

            {/* Botones */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isPending || ingredientes.length === 0 || !nombre.trim()}
                className={`px-4 py-2 rounded-lg text-white transition-all ${
                  isPending || ingredientes.length === 0 || !nombre.trim()
                    ? "bg-green-900/40 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isPending ? "Guardando..." : editData ? "Guardar cambios" : "Crear Receta"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
