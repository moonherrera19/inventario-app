"use client";

import { useState, useEffect } from "react";
import ModalEntrada from "@/components/entradas/ModalEntrada";

export default function EntradasPage() {
  const [entradas, setEntradas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // ============================
  // CARGAR ENTRADAS
  // ============================
  const cargarEntradas = async () => {
    try {
      const res = await fetch("/api/entradas");
      const data = await res.json();
      setEntradas(data);
    } catch (error) {
      console.error("Error cargando entradas:", error);
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
    cargarEntradas();
    cargarProductos(); 
  }, []);

  return (
    <div className="p-6">

      <button
        onClick={() => setOpenModal(true)}
        className="bg-green-600 px-4 py-2 rounded"
      >
        + Nueva Entrada
      </button>

      <ModalEntrada
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditData(null);
        }}
        onSuccess={cargarEntradas}   // ← ✔ CORREGIDO
        editData={editData}
        productos={productos}
      />
    </div>
  );
}
