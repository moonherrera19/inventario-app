"use client";

import { useState, useTransition } from "react";

export default function ModalProveedor({ close, refresh, editData }: any) {
  const [nombre, setNombre] = useState(editData?.nombre || "");
  const [telefono, setTelefono] = useState(editData?.telefono || "");
  const [correo, setCorreo] = useState(editData?.correo || "");
  const [direccion, setDireccion] = useState(editData?.direccion || "");
  const [rfc, setRfc] = useState(editData?.rfc || "");

  const [isPending, startTransition] = useTransition();

  // ------------------------------------------------------
  // GUARDAR / EDITAR
  // ------------------------------------------------------
  const guardar = () => {
    if (!nombre.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }

    startTransition(async () => {
      const data: any = {
        nombre,
        telefono,
        correo,
        direccion,
        rfc,
      };

      let url = "/api/proveedores";
      let method = "POST";

      if (editData) {
        method = "PUT";
        data["id"] = editData.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        refresh();
        close();
      } else {
        alert("Ocurrió un error.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-40">
      <div className="bg-[#1a1f25] w-[420px] p-6 rounded-xl border border-green-700 shadow-xl">
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          {editData ? "Editar Proveedor" : "Nuevo Proveedor"}
        </h2>

        {/* Nombre */}
        <label className="text-sm text-gray-300">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1217] border border-green-700 rounded-md text-white mb-4"
        />

        {/* Teléfono */}
        <label className="text-sm text-gray-300">Teléfono</label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1217] border border-green-700 rounded-md text-white mb-4"
        />

        {/* Correo */}
        <label className="text-sm text-gray-300">Correo</label>
        <input
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1217] border border-green-700 rounded-md text-white mb-4"
        />

        {/* Dirección */}
        <label className="text-sm text-gray-300">Dirección</label>
        <input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1217] border border-green-700 rounded-md text-white mb-4"
        />

        {/* RFC */}
        <label className="text-sm text-gray-300">RFC</label>
        <input
          value={rfc}
          onChange={(e) => setRfc(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1217] border border-green-700 rounded-md text-white mb-4"
        />

        {/* BOTONES */}
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
            {editData ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
