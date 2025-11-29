"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function ModalImportProductos({ isOpen, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState<any[]>([]);

  const leerExcel = async (archivo: File) => {
    const data = await archivo.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    setPreview(json);
  };

  const handleFile = (e: any) => {
    const archivo = e.target.files[0];
    setFile(archivo);
    leerExcel(archivo);
  };

  const importar = async () => {
    if (!preview.length) return alert("No hay datos para importar");

    const res = await fetch("/api/import/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preview),
    });

    if (res.ok) {
      alert("Productos importados correctamente");
      onImported();
      onClose();
    } else {
      alert("Error al importar");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">

      <div className="bg-[#111418] w-full max-w-3xl rounded-xl shadow-xl border border-green-900/40 overflow-hidden max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-green-900/40 flex justify-between items-center">
          <h2 className="text-xl font-bold text-green-300">
            Importar Productos desde Excel
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-400 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* INPUT */}
        <div className="p-4 flex flex-col gap-3">
          <label className="text-green-400 font-semibold">
            Archivo Excel (.xlsx):
          </label>

          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFile}
            className="w-full text-sm text-green-200"
          />
        </div>

        {/* PREVIEW */}
        <div className="px-4 pb-4">
          {preview.length > 0 && (
            <div className="border border-green-800 rounded-lg mt-2">

              {/* CABECERA FIJA */}
              <div className="grid grid-cols-4 bg-green-900/40 text-green-200 font-bold text-sm p-2 sticky top-0 border-b border-green-800">
                <div>Nombre</div>
                <div>Unidad</div>
                <div>Stock</div>
                <div>Stock Mín.</div>
              </div>

              {/* SCROLLABLE BODY */}
              <div className="max-h-[380px] overflow-y-auto">
                {preview.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-4 text-sm p-2 border-b border-green-800/20 hover:bg-green-900/20"
                  >
                    <div>{row.nombre}</div>
                    <div>{row.unidad}</div>
                    <div>{row.stock}</div>
                    <div>{row.stockMinimo}</div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-green-900/40 flex justify-end">
          <button
            onClick={importar}
            className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg font-semibold text-white shadow-md"
          >
            Importar
          </button>
        </div>

      </div>
    </div>
  );
}
