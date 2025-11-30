"use client";

import { useState, useEffect } from "react";
import CompraModal from "@/components/modals/CompraModal";

export default function ComprasPage() {
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);

  const cargarCompras = async () => {
    const res = await fetch("/api/compras");
    const data = await res.json();
    setCompras(data);
  };

  const cargarProductos = async () => {
    const res = await fetch("/api/productos");
    const data = await res.json();
    setProductos(data);
  };

  useEffect(() => {
    cargarCompras();
    cargarProductos();
  }, []);

  return (
    <div className="p-6">

      <button
        onClick={() => setModal(true)}
        className="bg-green-600 px-4 py-2 rounded"
      >
        + Nueva Compra
      </button>

      {/* MODAL */}
      <CompraModal
        open={modal}
        onClose={() => setModal(false)}
        onSuccess={cargarCompras}
        productos={productos}   // ✔ NECESARIO
      />
    </div>
  );
}
