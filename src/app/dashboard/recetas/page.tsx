"use client";

import { useEffect, useState, useTransition } from "react";
import RecetaModal from "@/components/recetas/RecetaModal";

export default function RecetasPage() {
  const [recetas, setRecetas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);

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
      console.error("Error cargando recetas:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // CARGAR PRODUCTOS  ✔ AQUI ESTABA EL PROBLEMA
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

  // ============================
  // INICIALIZAR
  // ============================
  useEffect(() => {
    cargarRecetas();
    cargarProductos(); // ✔ IMPORTANTE
  }, []);

  return (
    <div className="p-6">
      <button
        className="bg-green-600 px-4 py-2 rounded"
        onClick={() => setOpenModal(true)}
      >
        + Nueva Receta
      </button>

      <RecetaModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditData(null);
        }}
        refresh={cargarRecetas}
        editData={editData}
        productos={productos} // ✔ MANDAR PRODUCTOS
      />
    </div>
  );
}
