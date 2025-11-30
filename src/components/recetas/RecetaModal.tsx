"use client";

import { useState, useTransition } from "react";
import ModalIngrediente from "./ModalIngrediente";

interface RecetaModalProps {
  open: boolean;
  onClose: () => void;
  refresh: () => void;
  editData?: any;
  productos: any[];
}

export default function RecetaModal({
  open,
  onClose,
  refresh,
  editData,
  productos,
}: RecetaModalProps) {
  const [nombre, setNombre] = useState(editData?.nombre || "");
  const [ingredientes, setIngredientes] = useState<any[]>(
    editData?.ingredientes || []
  );

  const [openIng, setOpenIng] = useState(false);
  const [isPending, startTransition] = useTransition();

  const guardar = () => {
    if (!nombre.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }

    startTransition(async () => {
      // 👇 Corrección: data como any para permitir id dinámico
      let data: any = { nombre, ingredientes };

      let url = "/api/recetas";
      let method = "POST";

      if (editData) {
        method = "PUT";
        data.id = editData.id; // ya no marca error
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        refresh();
        onClose();
      } else {
        alert("Error guardando receta");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-40">
      <div className="bg-[#1a1f25] w-[500px] p-6 rounded-xl border border-green-700 shadow-xl">

        <h2 className="text-2xl font-bold text-green-400 mb-4">
          {editData ? "Editar Receta" : "Nueva Receta"}
        </h2>

        {/* Nombre */}
        <label className="text-sm text-gray-300">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1217] border border-green-700 rounded-md text-white mb-4"
        />

        {/* Ingredientes */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">Ingredientes</span>

          <button
            onClick={() => setOpenIng(true)}
            className="px-3 py-1 bg-green-600 rounded-lg hover:bg-green-700"
          >
            + Agregar
          </button>
        </div>

        <div className="bg-[#0f1217] border border-green-700 rounded-md p-3 max-h-40 overflow-y-auto text-sm">
          {ingredientes.length === 0 && (
            <p className="text-gray-400">Sin ingredientes.</p>
          )}

          {ingredientes.map((ing, i) => (
            <div key={i} className="text-white mb-1">
              • {ing.producto?.nombre} – {ing.cantidad} {ing.producto?.unidad}
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={guardar}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            {editData ? "Guardar Cambios" : "Crear"}
          </button>
        </div>
      </div>

      {/* Modal de ingrediente */}
      <ModalIngrediente
        open={openIng}
        onClose={() => setOpenIng(false)}
        productos={productos}
        ingredientesActuales={ingredientes}
        onSave={(nuevo) => setIngredientes(nuevo)}
      />
    </div>
  );
}
