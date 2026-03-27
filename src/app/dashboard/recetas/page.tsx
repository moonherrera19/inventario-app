"use client";

import { useState } from "react";

export default function AplicacionModal({ open, onClose }: any) {
  const [form, setForm] = useState({
    fecha: "",
    horaInicio: "",
    horaFin: "",
    aplicadores: "",
    producto: "",
    cantidadBarril: "",
    cantidadTotal: "",
    sectores: "",
    rancho: "",
    cultivo: "",
    observaciones: "",
  });

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    await fetch("/api/aplicaciones", {
      method: "POST",
      body: JSON.stringify(form),
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-2xl space-y-3">
        <h2 className="text-green-400 text-xl">Nueva Aplicación</h2>

        <input type="date" name="fecha" onChange={handleChange} className="input" />
        <input type="time" name="horaInicio" onChange={handleChange} className="input" />
        <input type="time" name="horaFin" onChange={handleChange} className="input" />

        <input name="aplicadores" placeholder="Aplicadores" onChange={handleChange} className="input" />

        <input name="producto" placeholder="Producto" onChange={handleChange} className="input" />
        <input name="cantidadBarril" placeholder="Cant x barril" onChange={handleChange} className="input" />
        <input name="cantidadTotal" placeholder="Cant total" onChange={handleChange} className="input" />

        <input name="sectores" placeholder="Sectores" onChange={handleChange} className="input" />
        <input name="rancho" placeholder="Rancho" onChange={handleChange} className="input" />
        <input name="cultivo" placeholder="Cultivo" onChange={handleChange} className="input" />

        <textarea name="observaciones" placeholder="Observaciones" onChange={handleChange} className="input h-20" />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-600 px-3 py-1 rounded">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="bg-green-600 px-3 py-1 rounded">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}