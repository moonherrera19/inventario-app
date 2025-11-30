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
    cargarProductos(); // ✔ IMPORTANTE
  }, []);

  return (
    <div className="p-6">

      <button
        onClick={() => setOpenModal(true)}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        + Nueva Salida
      </button>

      <ModalSalida
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={cargarSalidas}   // ✔ CORRECTO
        productos={productos}       // ✔ PRODUCTOS PARA EL SELECT
      />
    </div>
  );
}
