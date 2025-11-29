"use client";

import { useState, useEffect } from "react";
import ModalSalida from "@/components/salidas/ModalSalida";

export default function SalidasPage() {
  const [salidas, setSalidas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);

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
  // CARGAR PRODUCTOS — IMPORTANTE
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
    cargarProductos(); // ✔ SIN ESTO EL SELECT VIENE VACÍO
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
        onClose={() => {
          setOpenModal(false);
          setEditData(null);
        }}
        refresh={cargarSalidas}
        editData={editData}
        productos={productos}  // ✔ ENVÍA LOS PRODUCTOS
      />
    </div>
  );
}
