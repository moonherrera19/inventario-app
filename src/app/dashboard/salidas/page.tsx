"use client";

import { useState, useEffect } from "react";
import ModalSalida from "@/components/salidas/ModalSalida";

export default function SalidasPage() {
  const [salidas, setSalidas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  // ============================
  // CARGAR SALIDAS
  // ============================
  const cargarSalidas = async () => {
    try {
      const res = await fetch("/api/salidas");
      const data = await res.json();
      setSalidas(data);
    } catch (error) {
      console.error("Error cargando salidas:", error);
    }
  };

  // ============================
  // CARGAR PRODUCTOS
  // ============================
  const cargarProductos = async () => {
    try {
      const res = await fetch("/api/productos");
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  useEffect(() => {
    cargarSalidas();
    cargarProductos(); 
  }, []);

  return (
    <div className="p-6">

      {/* BOTÓN */}
      <button
        onClick={() => setOpenModal(true)}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        + Nueva Salida
      </button>

      {/* MODAL */}
      <ModalSalida
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={cargarSalidas}
        productos={productos}
      />

      {/* ============================
            MOVIMIENTOS RECIENTES
      ============================ */}
      <div className="mt-8 bg-[#0f1217] p-4 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Movimientos recientes
        </h2>

        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="py-2">Fecha</th>
              <th className="py-2">Producto</th>
              <th className="py-2">Unidad</th>
              <th className="py-2">Salida</th>
            </tr>
          </thead>

          <tbody>
            {salidas.slice(0, 10).map((s) => (
              <tr key={s.id} className="border-b border-gray-800">
                <td className="py-2">
                  {new Date(s.fecha).toLocaleString("es-MX")}
                </td>
                <td className="py-2">{s.producto?.nombre}</td>
                <td className="py-2">{s.producto?.unidad}</td>
                <td className="py-2 font-semibold text-red-400">{s.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
