"use client";

import { useState, useEffect } from "react";
import ModalSalida from "@/components/salidas/ModalSalida";
import ModalEditarSalida from "@/components/salidas/ModalEditarSalida";

// ==============================
// TIPADO
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

interface ProductoType {
  id: number;
  nombre: string;
  unidad: string;
  manejaLotes: boolean;
}

export default function SalidasPage() {
  const [salidas, setSalidas] = useState<SalidaType[]>([]);
  const [productos, setProductos] = useState<ProductoType[]>([]);
  const [openModal, setOpenModal] = useState(false);

  // MODAL EDITAR
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState<SalidaType | null>(null);

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
      console.error("❌ Error cargando salidas:", error);
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

  useEffect(() => {
    cargarSalidas();
    cargarProductos();
  }, []);

  // ============================
  // EDITAR
  // ============================
  const abrirModalEditar = (salida: SalidaType) => {
    setEditData(salida);
    setOpenEdit(true);
  };

  // ============================
  // FILTROS
  // ============================
  const salidasFiltradas = salidas.filter((s) => {
    const ranchoOk = filtroRancho
      ? (s.rancho || "").toLowerCase().includes(filtroRancho.toLowerCase())
      : true;

    const cultivoOk = filtroCultivo
      ? (s.cultivo || "").toLowerCase().includes(filtroCultivo.toLowerCase())
      : true;

    return ranchoOk && cultivoOk;
  });

  return (
    <div className="p-6 space-y-6 text-white">

      {/* BOTÓN NUEVA SALIDA */}
      <button
        onClick={() => setOpenModal(true)}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
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

      {/* MODAL EDITAR */}
      {openEdit && editData && (
        <ModalEditarSalida
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          data={editData}
          refresh={cargarSalidas}
        />
      )}

      {/* FILTROS */}
      <div className="flex gap-4">
        <input
          placeholder="Filtrar por rancho…"
          value={filtroRancho}
          onChange={(e) => setFiltroRancho(e.target.value)}
          className="px-3 py-2 bg-[#0f1217] border border-blue-700 rounded text-white"
        />

        <input
          placeholder="Filtrar por cultivo…"
          value={filtroCultivo}
          onChange={(e) => setFiltroCultivo(e.target.value)}
          className="px-3 py-2 bg-[#0f1217] border border-blue-700 rounded text-white"
        />
      </div>

      {/* TABLA */}
      <div className="bg-[#0f1217] p-4 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">
          Movimientos recientes
        </h2>

        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="border-b border-gray-700 text-left">
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
                <td className="py-2">
                  {new Date(s.fecha).toLocaleString("es-MX")}
                </td>
                <td className="py-2">{s.producto?.nombre}</td>
                <td className="py-2">{s.producto?.unidad}</td>
                <td className="py-2">{s.rancho || "-"}</td>
                <td className="py-2">{s.cultivo || "-"}</td>
                <td className="py-2 font-semibold text-red-400">
                  {s.cantidad}
                </td>
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
