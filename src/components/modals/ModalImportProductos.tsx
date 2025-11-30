"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface ModalImportProductosProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (rows: any[]) => void;
}

export default function ModalImportProductos({
  isOpen,
  onClose,
  onImported,
}: ModalImportProductosProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFile = (e: any) => {
    const f = e.target.files?.[0];
    setFile(f);

    if (f) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        setPreview(rows);
      };
      reader.readAsArrayBuffer(f);
    }
  };

  const importar = () => {
    if (!preview.length) {
      alert("No hay datos para importar.");
      return;
    }

    onImported(preview);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0f1217] border border-green-700 p-6 rounded-xl w-full max-w-lg text-white">

        <h2 className="text-xl font-bold mb-4 text-green-400">Importar Productos</h2>

        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFile}
          className="border border-green-600 bg-[#1a1f25] p-2 rounded w-full mb-4"
        />

        {preview.length > 0 && (
          <div className="max-h-40 overflow-auto text-sm bg-black/20 p-2 rounded border border-green-800">
            {preview.slice(0, 5).map((row, i) => (
              <pre key={i}>{JSON.stringify(row, null, 2)}</pre>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>

          <button
            onClick={importar}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Importar
          </button>
        </div>

      </div>
    </div>
  );
}
