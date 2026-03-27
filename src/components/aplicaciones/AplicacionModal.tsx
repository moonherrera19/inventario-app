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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-4xl border border-green-500">

        <h2 className="text-green-400 text-xl mb-4">
          Registro de Aplicación
        </h2>

        {/* ===================== */}
        {/* FECHA Y HORAS */}
        {/* ===================== */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-sm text-gray-400">Fecha</label>
            <input type="date" name="fecha" onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm text-gray-400">Inicio</label>
            <input type="time" name="horaInicio" onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm text-gray-400">Fin</label>
            <input type="time" name="horaFin" onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm text-gray-400">Aplicadores</label>
            <input name="aplicadores" onChange={handleChange} className="input" />
          </div>
        </div>

        {/* ===================== */}
        {/* PRODUCTO */}
        {/* ===================== */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-sm text-gray-400">Producto</label>
            <input name="producto" onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm text-gray-400">Cant x Barril</label>
            <input name="cantidadBarril" onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm text-gray-400">Cant Total</label>
            <input name="cantidadTotal" onChange={handleChange} className="input" />
          </div>
        </div>

        {/* ===================== */}
        {/* UBICACIÓN */}
        {/* ===================== */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-sm text-gray-400">Sectores</label>
            <input name="sectores" onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm text-gray-400">Rancho</label>
            <input name="rancho" onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="text-sm text-gray-400">Cultivo</label>
            <input name="cultivo" onChange={handleChange} className="input" />
          </div>
        </div>

        {/* ===================== */}
        {/* OBSERVACIONES */}
        {/* ===================== */}
        <div className="mb-4">
          <label className="text-sm text-gray-400">Observaciones</label>
          <textarea
            name="observaciones"
            onChange={handleChange}
            className="input h-24"
          />
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="bg-gray-600 px-4 py-2 rounded">
            Cancelar
          </button>

          <button onClick={handleSubmit} className="bg-green-600 px-4 py-2 rounded">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}