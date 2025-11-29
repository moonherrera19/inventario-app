"use client";

import { useEffect, useState, useTransition } from "react";
import ModalProveedor from "@/components/proveedores/ModalProveedor";


export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);

  const [isPending, startTransition] = useTransition();

  // ------------------------------------------------------
  // CARGAR PROVEEDORES
  // ------------------------------------------------------
  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/proveedores");

      if (!res.ok) {
        throw new Error("Error al obtener proveedores");
      }

      const data = await res.json();
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  // ------------------------------------------------------
  // ELIMINAR PROVEEDOR
  // ------------------------------------------------------
  const eliminarProveedor = async (id: number) => {
    const confirmar = confirm("¿Seguro que deseas eliminar este proveedor?");
    if (!confirmar) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/proveedores?id=${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("No se pudo eliminar el proveedor");
        }

        cargarProveedores();
      } catch (error) {
        alert("Error al eliminar proveedor.");
        console.error(error);
      }
    });
  };

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">
      {/* ------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------ */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-green-400 drop-shadow-lg">
          Proveedores
        </h1>

        <button
          onClick={() => {
            setEditData(null);
            setOpenModal(true);
          }}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold transition-all duration-200"
        >
          + Nuevo proveedor
        </button>
      </div>

      {/* ------------------------------------------------ */}
      {/* TABLA */}
      {/* ------------------------------------------------ */}
      <div className="bg-[#1a1f25] p-4 rounded-xl border border-green-800/40 shadow-lg">
        {loading ? (
          <p className="text-gray-400 animate-pulse">
            Cargando proveedores...
          </p>
        ) : proveedores.length === 0 ? (
          <p className="text-gray-400">No hay proveedores registrados.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-green-300 border-b border-green-800/40">
                <th className="py-3">Nombre</th>
                <th className="py-3">Teléfono</th>
                <th className="py-3">Correo</th>
                <th className="py-3">Dirección</th>
                <th className="py-3">RFC</th>
                <th className="py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {proveedores.map((prov: any) => (
                <tr
                  key={prov.id}
                  className="border-b border-green-800/20 hover:bg-green-900/10 transition-all duration-150"
                >
                  <td className="py-3 font-semibold text-green-400">
                    {prov.nombre}
                  </td>

                  <td className="py-3 text-gray-300">
                    {prov.telefono || "-"}
                  </td>

                  <td className="py-3 text-gray-300">
                    {prov.correo || "-"}
                  </td>

                  <td className="py-3 text-gray-300">
                    {prov.direccion || "-"}
                  </td>

                  <td className="py-3 text-gray-300">{prov.rfc || "-"}</td>

                  <td className="py-2 flex gap-2 justify-center">
                    {/* Editar */}
                    <button
                      onClick={() => {
                        setEditData(prov);
                        setOpenModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md transition-all"
                    >
                      Editar
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => eliminarProveedor(prov.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md transition-all"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ------------------------------------------------ */}
      {/* MODAL */}
      {/* ------------------------------------------------ */}
      {openModal && (
        <ModalProveedor
          close={() => setOpenModal(false)}
          refresh={cargarProveedores}
          editData={editData}
        />
      )}
    </div>
  );
}
