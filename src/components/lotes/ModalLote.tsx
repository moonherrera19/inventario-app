"use client";

import { useState, useTransition } from "react";

export default function ModalLote({ open, onClose }) {
  const [nombre, setNombre] = useState("");
  const [cultivo, setCultivo] = useState("");
  const [areaHa, setAreaHa] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setNombre("");
    setCultivo("");
    setAreaHa("");
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const areaNum = Number(areaHa);

    // VALIDACIONES UI
    if (!nombre.trim()) return setError("El nombre del lote es obligatorio.");
    if (!cultivo.trim()) return setError("El cultivo es obligatorio.");

    if (isNaN(areaNum) || areaNum < 0)
      return setError("El área del lote debe ser mayor o igual a 0.");

    startTransition(async () => {
      try {
        const res = await fetch("/api/lotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            cultivo,
            areaHa: areaNum,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          return setError(data.message || "No se pudo crear el lote.");
        }

        setSuccess("Lote registrado correctamente.");
        resetForm();

        setTimeout(() => {
          onClose();
        }, 1100);
      } catch (err) {
        setError("Error inesperado. Intenta nuevamente.");
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-[#0f1a13] border border-green-800 w-full max-w-md p-6 rounded-xl shadow-xl">

        <h2 className="text-2xl font-bold text-green-300 mb-4 text-center">
          Registrar Lote
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* NOMBRE */}
          <div>
            <label className="block text-sm text-green-200 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white"
              placeholder="Ej. Lote Norte"
            />
          </div>

          {/* CULTIVO */}
          <div>
            <label className="block text-sm text-green-200 mb-1">Cultivo</label>
            <input
              type="text"
              value={cultivo}
              onChange={(e) => setCultivo(e.target.value)}
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white"
              placeholder="Ej. Maíz, Aguacate"
            />
          </div>

          {/* AREA */}
          <div>
            <label className="block text-sm text-green-200 mb-1">
              Área del lote (ha)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={areaHa}
              onChange={(e) => setAreaHa(e.target.value)}
              className="w-full rounded-lg p-2 bg-[#142017] border border-green-700 text-white"
              placeholder="Ej. 1.5"
            />
          </div>

          {/* MENSAJES */}
          {error && (
            <p className="text-red-400 text-center text-sm">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-center text-sm">{success}</p>
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
                !nombre.trim() ||
                !cultivo.trim() ||
                isNaN(Number(areaHa)) ||
                Number(areaHa) < 0
              }
              className={`px-4 py-2 rounded-lg text-white transition-all ${
                isPending ||
                !nombre.trim() ||
                !cultivo.trim() ||
                isNaN(Number(areaHa)) ||
                Number(areaHa) < 0
                  ? "bg-green-900/40 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isPending ? "Guardando..." : "Registrar Lote"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
