"use client";

import { useEffect, useState } from "react";
import RecetaModal from "@/components/recetas/RecetaModal";
import AplicacionModal from "@/components/aplicaciones/AplicacionModal";

export default function RecetasPage() {
  const [recetas, setRecetas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [openAplicacion, setOpenAplicacion] = useState(false);

  // ============================
  // CARGAR RECETAS
  // ============================
  const cargarRecetas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recetas");
      const data = await res.json();
      setRecetas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // CARGAR PRODUCTOS
  // ============================
  const cargarProductos = async () => {
    const res = await fetch("/api/productos");
    const data = await res.json();
    setProductos(data);
  };

  useEffect(() => {
    cargarRecetas();
    cargarProductos();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* BOTONES */}
      <div className="flex gap-3">
        <button
          className="bg-green-600 px-4 py-2 rounded"
          onClick={() => setOpenModal(true)}
        >
          + Nueva Receta
        </button>

        <button
          className="bg-blue-600 px-4 py-2 rounded"
          onClick={() => setOpenAplicacion(true)}
        >
          + Nueva Aplicación
        </button>
      </div>

      {/* LISTA */}
      {loading ? (
        <p className="text-white">Cargando...</p>
      ) : recetas.length === 0 ? (
        <p className="text-gray-400">No hay recetas aún</p>
      ) : (
        <div className="grid gap-3">
          {recetas.map((r: any) => (
            <div
              key={r.id}
              className="bg-gray-800 p-4 rounded border border-green-500"
            >
              <p className="text-green-400 font-bold">{r.nombre}</p>
              <p className="text-sm text-gray-300">
                Ingredientes: {r.ingredientes?.length || 0}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* MODALES */}
      <RecetaModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        refresh={cargarRecetas}
        productos={productos}
      />

      <AplicacionModal
        open={openAplicacion}
        onClose={() => setOpenAplicacion(false)}
      />
    </div>
  );
}