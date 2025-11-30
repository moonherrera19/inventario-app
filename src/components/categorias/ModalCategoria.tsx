"use client";

import { useState, useTransition } from "react";

export default function ModalCategoria({ close, refresh, editData }: any) {
  const [nombre, setNombre] = useState(editData?.nombre || "");
  const [descripcion, setDescripcion] = useState(editData?.descripcion || "");

  const [isPending, startTransition] = useTransition();

  // ----------------------------------------------------------
  // GUARDAR / EDITAR
  // ----------------------------------------------------------
  const guardar = () => {
    if (!nombre.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }

    startTransition(async () => {
      // 👇 Declarar como ANY para evitar el error TS
      let data: any = {
        nombre,
        descripcion,
      };

      let url = "/api/categorias";
      let method = "POST";

      if (editData) {
        method = "PUT";
        data.id = editData.id; // ✔ TS ya no protesta
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        refresh(); // refrescar tabla
        close(); // cerrar modal
      } else {
        alert("Ocurrió un error.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-40">
      <div className="bg-[#1a1f25] w-96 p-6 rounded-xl border border-green-700 shadow-xl">
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          {editData ? "Editar Categoría" : "Nueva Categoría"}
        </h2>

        {/* Nombre */}
        <label className="text-sm text-gray-300">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1217] border border-green-700 rounded-md text-white mb-4"
        />

        {/* Descripción */}
        <label className="text-sm text-gray-300">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1217] border border-green-700 rounded-md text-white mb-4"
        />

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            onClick={close}
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
    </div>
  );
}
