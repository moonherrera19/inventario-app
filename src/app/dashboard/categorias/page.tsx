"use client";

import { useEffect, useState, useTransition } from "react";
import ModalCategoria from "@/components/categorias/ModalCategoria";


export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [isPending, startTransition] = useTransition();

  const cargar = async () => {
    setLoading(true);
    const res = await fetch("/api/categorias");
    const data = await res.json();
    setCategorias(data);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar categoría?")) return;

    await fetch(`/api/categorias?id=${id}`, { method: "DELETE" });
    cargar();
  };

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-green-400">Categorías</h1>

        <button
          onClick={() => {
            setEditData(null);
            setOpenModal(true);
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl"
        >
          + Nueva categoría
        </button>
      </div>

      <div className="bg-[#1a1f25] p-4 rounded-xl border border-green-800/40">
        {loading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : categorias.length === 0 ? (
          <p className="text-gray-400">No hay categorías registradas.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-green-300 border-b border-green-800/40">
                <th className="py-3">ID</th>
                <th className="py-3">Nombre</th>
                <th className="py-3">Descripción</th>
                <th className="py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {categorias.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-green-800/20 hover:bg-green-900/10"
                >
                  <td className="py-3">{cat.id}</td>
                  <td className="py-3 text-green-400 font-semibold">
                    {cat.nombre}
                  </td>
                  <td className="py-3">{cat.descripcion}</td>

                  <td className="py-2 flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        setEditData(cat);
                        setOpenModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => eliminar(cat.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md"
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

      {openModal && (
        <ModalCategoria
          close={() => setOpenModal(false)}
          refresh={cargar}
          editData={editData}
        />
      )}
    </div>
  );
}
