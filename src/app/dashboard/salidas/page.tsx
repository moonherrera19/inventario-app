"use client";

import { useState, useEffect } from "react";
import ModalSalida from "@/components/salidas/ModalSalida";
import ModalEditarSalida from "@/components/salidas/ModalEditarSalida";

// ==============================
// TIPADO DE LA DATA 
// ==============================
interface SalidaType {
  id: number;
  fecha: string;
  cantidad: number;
  rancho?: string | null;
  cultivo?: string | null;
  producto: {
    nombre: string;
    unidad: string;
  };
}

export default function SalidasPage() {
  const [salidas, setSalidas] = useState<SalidaType[]>([]);
  const [productos, setProductos] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  // MODAL EDITAR
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // FILTROS
  const [filtroRancho, setFiltroRancho] = useState("");
  const [filtroCultivo, setFiltroCultivo] = useState("");

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

  // ============================
  // ABRIR MODAL EDITAR
  // ============================
  const abrirModalEditar = (salida: SalidaType) => {
    setEditData(salida);
    setOpenEdit(true);
  };

  // ============================
  // APLICAR FILTROS
  // ============================
  const salidasFiltradas = salidas.filter((s) => {
    return (
      (filtroRancho ? (s.rancho || "").toLowerCase().includes(filtroRancho.toLowerCase()) : true) &&
      (filtroCultivo ? (s.cultivo || "").toLowerCase().includes(filtroCultivo.toLowerCase()) : true)
    );
  });

  return (
    <div className="p-6">

      {/* BOTÓN NUEVA SALIDA */}
      <button
        onClick={() => setOpenModal(true)}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        + Nueva Salida
      </button>

      {/* MODAL NUEVA SALIDA */}
      <ModalSalida
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={cargarSalidas}
        productos={productos}
      />

      {/* MODAL EDITAR SALIDA */}
      <ModalEditarSalida
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        data={editData}
        refresh={cargarSalidas}
      />

      {/* ============================
            FILTROS
      ============================ */}
      <div className="flex gap-4 mt-6 mb-4">
        <input
          placeholder="Filtrar por rancho..."
          value={filtroRancho}
          onChange={(e) => setFiltroRancho(e.target.value)}
          className="px-3 py-2 bg-[#0f1217] border border-blue-700 text-white rounded"
        />

        <input
          placeholder="Filtrar por cultivo..."
          value={filtroCultivo}
          onChange={(e) => setFiltroCultivo(e.target.value)}
          className="px-3 py-2 bg-[#0f1217] border border-blue-700 text-white rounded"
        />
      </div>

      {/* ============================
            MOVIMIENTOS RECIENTES
      ============================ */}
      <div className="mt-4 bg-[#0f1217] p-4 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Movimientos recientes
        </h2>

        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="py-2">Fecha</th>
              <th className="py-2">Producto</th>
              <th className="py-2">Unidad</th>
              <th className="py-2">Rancho</th>
              <th className="py-2">Cultivo</th>
              <th className="py-2">Salida</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {salidasFiltradas.slice(0, 10).map((s) => (
              <tr key={s.id} className="border-b border-gray-800">
                <td className="py-2">{new Date(s.fecha).toLocaleString("es-MX")}</td>
                <td className="py-2">{s.producto?.nombre}</td>
                <td className="py-2">{s.producto?.unidad}</td>
                <td className="py-2">{s.rancho || "-"}</td>
                <td className="py-2">{s.cultivo || "-"}</td>
                <td className="py-2 font-semibold text-red-400">{s.cantidad}</td>

                {/* Botón Editar */}
                <td className="py-2">
                  <button
                    onClick={() => abrirModalEditar(s)}
                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white"
                  >
                    Editar
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
