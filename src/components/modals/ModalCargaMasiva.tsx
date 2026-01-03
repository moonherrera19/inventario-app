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
      // 1️⃣ Leer Excel
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
      });

      console.log("📄 Filas leídas del Excel:", rows.length);

      // 2️⃣ Enviar al backend
      const res = await fetch("/api/compras-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows }),
      });

      // 🔴 AQUÍ ESTABA EL PROBLEMA: ahora sí leemos la respuesta
      const data = await res.json();
      console.log("📦 Respuesta backend:", data);

      if (!res.ok || !data.ok) {
        alert("❌ Error en la carga masiva");
        return;
      }

      // 3️⃣ MENSAJE CLARO AL USUARIO
      alert(
        `✅ Carga masiva completada\n\n` +
        `Total filas: ${data.resumen.totalFilas}\n` +
        `Insertadas: ${data.resumen.insertados}\n` +
        `Ignoradas: ${data.resumen.ignorados}`
      );

      // 4️⃣ Refrescar tabla
      onSuccess();

      // 5️⃣ Limpiar y cerrar
      setFile(null);
      onClose();
    } catch (error) {
      console.error("❌ Error modal carga masiva:", error);
      alert("Error inesperado al procesar el archivo");
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

        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />

        <label
          htmlFor="file-upload"
          className="inline-block bg-gray-700 px-4 py-2 rounded text-white cursor-pointer mb-3"
        >
          Elegir archivo
        </label>

        <p className="text-sm mb-4 text-gray-300">
          {file
            ? `Archivo seleccionado: ${file.name}`
            : "No se eligió ningún archivo"}
        </p>

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
