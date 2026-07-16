"use client";

import { useState, useEffect } from "react";
import ModalEntrada from "@/components/entradas/ModalEntrada";
import ModalEditarFechaEntrada from "@/components/entradas/ModalEditarFechaEntrada";

export default function EntradasPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [recientes, setRecientes] = useState<any[]>([]);

  // MODAL EDITAR FECHA (nuevo, independiente)
  const [openEditFecha, setOpenEditFecha] = useState(false);
  const [editFechaData, setEditFechaData] = useState<any>(null);

  // ============================
  // CARGAR ENTRADAS
  // ============================
  const cargarEntradas = async () => {
    try {
      const res = await fetch("/api/entradas");
      const data = await res.json();
      setEntradas(data);
    } catch (error) {
      console.error("❌ Error cargando entradas:", error);
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
      console.error("❌ Error cargando productos:", error);
    }
  };

  // ============================
  // CARGAR MOVIMIENTOS RECIENTES
  // ============================
  const cargarRecientes = async () => {
    try {
      const res = await fetch("/api/entradas/recientes");
      const data = await res.json();
      setRecientes(data);
    } catch (error) {
      console.error("❌ Error cargando recientes:", error);
    }
  };

  useEffect(() => {
    cargarEntradas();
    cargarProductos();
    cargarRecientes();
  }, []);

  // ============================
  // EDITAR FECHA (nuevo)
  // ============================
  const abrirModalEditarFecha = (entrada: any) => {
    setEditFechaData(entrada);
    setOpenEditFecha(true);
  };

  return (
    <div className="p-6 text-white space-y-8">

      {/* =========================
          BOTÓN NUEVA ENTRADA
      ========================== */}
      <button
        onClick={() => setOpenModal(true)}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium"
      >
        + Nueva Entrada
      </button>

      {/* =========================
          MODAL ENTRADA
      ========================== */}
      <ModalEntrada
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditData(null);
        }}
        onSuccess={() => {
          cargarEntradas();
          cargarRecientes();
        }}
        editData={editData}
        productos={productos} // 👈 AQUÍ ya viene manejaLotes
      />

      {/* =========================
          MODAL EDITAR FECHA (nuevo, independiente)
      ========================== */}
      {openEditFecha && editFechaData && (
        <ModalEditarFechaEntrada
          open={openEditFecha}
          onClose={() => setOpenEditFecha(false)}
          entradaId={editFechaData.id}
          fechaActual={editFechaData.fecha}
          refresh={() => {
            cargarEntradas();
            cargarRecientes();
          }}
        />
      )}

      {/* =========================
          MOVIMIENTOS RECIENTES
      ========================== */}
      <div className="bg-[#0f171f] p-6 rounded-lg border border-green-800/40 max-w-xl">
        <h2 className="text-xl font-semibold text-green-400 mb-4">
          Últimos movimientos de entradas
        </h2>

        {recientes.length === 0 ? (
          <p className="text-gray-400">Sin movimientos aún.</p>
        ) : (
          <ul className="space-y-3">
            {recientes.map((e: any) => (
              <li
                key={e.id}
                className="text-sm border-b border-green-900/30 pb-2 flex items-center justify-between gap-2"
              >
                <span>
                  📅 {new Date(e.fecha).toLocaleDateString()} —{" "}
                  <span className="text-green-300 font-medium">
                    {e.producto?.nombre}
                  </span>{" "}
                  ({e.cantidad} {e.producto?.unidad})
                </span>
                <button
                  onClick={() => abrirModalEditarFecha(e)}
                  title="Editar fecha"
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs shrink-0"
                >
                  📅 Editar fecha
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}