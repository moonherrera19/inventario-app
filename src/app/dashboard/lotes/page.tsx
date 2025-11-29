"use client";

import { useEffect, useState, useTransition } from "react";
import ModalLote from "@/components/lotes/ModalLote";

export default function LotesPage() {
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const cargarLotes = async () => {
    setLoading(true);
    const res = await fetch("/api/lotes");
    const json = await res.json();
    setLotes(json);
    setLoading(false);
  };

  useEffect(() => {
    cargarLotes();
  }, []);

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar lote? (Se borrarán sus consumos)")) return;

    startTransition(async () => {
      await fetch(`/api/lotes?id=${id}`, { method: "DELETE" });
      cargarLotes();
    });
  };

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">

      <div className="flex justify-between mb-6">
        <h1 className="text-4xl font-bold text-green-400 drop-shadow-lg">
          Lotes agrícolas
        </h1>

        <button
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl"
          onClick={() => {
            setEditData(null);
            setOpenModal(true);
          }}
        >
          + Nuevo lote
        </button>
      </div>

      <div className="bg-[#1a1f25] p-6 rounded-xl border border-green-800/40">

        {loading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : lotes.length === 0 ? (
          <p className="text-gray-500">No hay lotes registrados.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-green-300 border-b border-green-800/40">
                <th className="py-2">Nombre</th>
                <th>Cultivo</th>
                <th>Área (ha)</th>
                <th>Consumos registrados</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {lotes.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-green-800/20 hover:bg-green-900/10"
                >
                  <td className="py-2 text-green-300 font-semibold">
                    {l.nombre}
                  </td>

                  <td className="py-2 text-gray-200">
                    {l.cultivo || "-"}
                  </td>

                  <td className="py-2">{l.areaHa || "-"}</td>

                  <td className="py-2">{l.consumos.length}</td>

                  <td className="py-2 flex justify-center gap-2">
                    <button
                      className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
                      onClick={() => {
                        setEditData(l);
                        setOpenModal(true);
                      }}
                    >
                      Editar
                    </button>

                    <button
                      className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
                      onClick={() => eliminar(l.id)}
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
        <ModalLote
          close={() => setOpenModal(false)}
          refresh={cargarLotes}
          editData={editData}
        />
      )}

    </div>
  );
}
