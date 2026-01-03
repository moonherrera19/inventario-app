"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalCargaMasiva({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleUpload = async () => {
    if (!file) {
      alert("Selecciona un archivo primero");
      return;
    }

    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const res = await fetch("/admin/compras-admin/carga-masiva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        throw new Error("Error en la carga");
      }

      onSuccess();
      onClose();
      setFile(null);
    } catch (error) {
      console.error(error);
      alert("Error al procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
      <div className="w-[420px] bg-[#0c1117] p-6 border-l border-white/10">
        <h2 className="text-xl font-bold text-purple-400 mb-4">
          Carga masiva (Excel)
        </h2>

        {/* INPUT REAL OCULTO */}
        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />

        {/* BOTÓN QUE ABRE EL EXPLORADOR */}
        <label
          htmlFor="file-upload"
          className="inline-block bg-gray-700 px-4 py-2 rounded text-white cursor-pointer mb-3"
        >
          Elegir archivo
        </label>

        {/* NOMBRE DEL ARCHIVO */}
        <p className="text-sm mb-4 text-gray-300">
          {file ? `Archivo seleccionado: ${file.name}` : "No se eligió ningún archivo"}
        </p>

        {/* BOTONES */}
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-purple-600 px-4 py-2 rounded text-white disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Subir archivo"}
          </button>

          <button
            onClick={() => {
              setFile(null);
              onClose();
            }}
            className="bg-gray-700 px-4 py-2 rounded text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
