"use client";

import { useEffect, useState } from "react";
import CompraModal from "@/components/modals/CompraModal";

export default function ComprasPage() {
  const [compras, setCompras] = useState([]);
  const [modal, setModal] = useState(false);

  const cargarCompras = async () => {
    try {
      const res = await fetch("/api/compras");
      const data = await res.json();
      setCompras(data);
    } catch (error) {
      console.error("Error cargando compras:", error);
    }
  };

  useEffect(() => {
    cargarCompras();
  }, []);

  return (
    <div className="p-6 text-white">

      <h1 className="text-3xl font-bold text-green-400 mb-6">
        Compras (Modo Económico)
      </h1>

      {/* BOTÓN */}
      <button
        className="mb-6 px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold shadow-md"
        onClick={() => setModal(true)}
      >
        + Registrar compra
      </button>

      {/* MODAL — AQUÍ ESTABA EL ERROR */}
      <CompraModal
        open={modal}              // 🔥 Corrección IMPORTANTE
        onClose={() => setModal(false)}
        onSuccess={cargarCompras}
      />

      {/* TABLA */}
      <div className="overflow-x-auto rounded-lg border border-green-800/30">
        <table className="w-full text-left">
          <thead className="bg-[#13201d] text-green-300">
            <tr>
              <th className="p-3 border-b border-green-800/30">ID</th>
              <th className="p-3 border-b border-green-800/30">Producto</th>
              <th className="p-3 border-b border-green-800/30">Proveedor</th>
              <th className="p-3 border-b border-green-800/30">Cantidad</th>
              <th className="p-3 border-b border-green-800/30">Costo ($)</th>
              <th className="p-3 border-b border-green-800/30">Fecha</th>
            </tr>
          </thead>

          <tbody>
            {compras.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">
                  No hay compras registradas.
                </td>
              </tr>
            )}

            {compras.map((c: any) => (
              <tr key={c.id} className="hover:bg-green-900/10 transition">
                <td className="p-3 border-b border-green-800/20">{c.id}</td>
                <td className="p-3 border-b border-green-800/20">
                  {c.producto?.nombre}
                </td>
                <td className="p-3 border-b border-green-800/20">
                  {c.proveedor?.nombre}
                </td>
                <td className="p-3 border-b border-green-800/20">{c.cantidad}</td>
                <td className="p-3 border-b border-green-800/20">${c.costo}</td>
                <td className="p-3 border-b border-green-800/20">
                  {new Date(c.fecha).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
