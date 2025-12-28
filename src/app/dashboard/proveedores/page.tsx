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
      if (!res.ok) throw new Error("Error al obtener proveedores");
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
    if (!confirm("¿Seguro que deseas eliminar este proveedor?")) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/proveedores?id=${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        cargarProveedores();
      } catch {
        alert("Error al eliminar proveedor");
      }
    });
  };

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-green-400">
          Proveedores
        </h1>

        <div className="flex gap-3">
          {/* ⚠️ ESTE BOTÓN LO USAMOS DESPUÉS */}
          <button
            disabled
            className="bg-gray-600 px-4 py-2 rounded-xl opacity-50 cursor-not-allowed"
          >
            Importar Excel (próximo)
          </button>

          <button
            onClick={() => {
              setEditData(null);
              setOpenModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold"
          >
            + Nuevo proveedor
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-[#1a1f25] p-4 rounded-xl border border-green-800/40">
        {loading ? (
          <p className="text-gray-400">Cargando proveedores…</p>
        ) : proveedores.length === 0 ? (
          <p className="text-gray-400">No hay proveedores registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-green-300 border-b border-green-800/40">
                  <th>Nombre</th>
                  <th>Banco</th>
                  <th>Cuenta</th>
                  <th>CLABE</th>
                  <th>Banco USD</th>
                  <th>Cuenta USD</th>
                  <th>RFC</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {proveedores.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-green-800/20 hover:bg-green-900/10"
                  >
                    <td className="font-semibold text-green-400">
                      {p.nombre}
                    </td>
                    <td>{p.banco || "-"}</td>
                    <td>{p.numeroCuenta || "-"}</td>
                    <td>{p.clabe || "-"}</td>
                    <td>{p.bancoDolares || "-"}</td>
                    <td>{p.numeroCuentaDolares || "-"}</td>
                    <td>{p.rfc || "-"}</td>

                    <td className="flex gap-2 justify-center py-2">
                      <button
                        onClick={() => {
                          setEditData(p);
                          setOpenModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 rounded-md"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarProveedor(p.id)}
                        className="px-3 py-1 bg-red-600 rounded-md"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
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
