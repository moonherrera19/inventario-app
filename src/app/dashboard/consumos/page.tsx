"use client";

import { useEffect, useState, useTransition } from "react";
import ModalConsumo from "@/components/consumos/ModalConsumo";

export default function ConsumosPage() {
  const [consumos, setConsumos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const cargarConsumos = async () => {
    setLoading(true);
    const res = await fetch("/api/consumos");
    const json = await res.json();
    setConsumos(json);
    setLoading(false);
  };

  useEffect(() => {
    cargarConsumos();
  }, []);

  const eliminar = (id: number) => {
    if (!confirm("¿Eliminar consumo?")) return;

    startTransition(async () => {
      await fetch(`/api/consumos?id=${id}`, { method: "DELETE" });
      cargarConsumos();
    });
  };

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">

      <div className="flex justify-between mb-6">
        <h1 className="text-4xl font-bold text-green-400 drop-shadow-lg">
          Consumos por lote
        </h1>

        <button
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl"
          onClick={() => {
            setEditData(null);
            setOpenModal(true);
          }}
        >
          + Nuevo consumo
        </button>
      </div>

      <div className="bg-[#1a1f25] p-6 rounded-xl border border-green-800/40">

        {loading ? (
          <p className="text-gray-400 animate-pulse">Cargando...</p>
        ) : consumos.length === 0 ? (
          <p className="text-gray-500">No hay consumos registrados.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-green-300 border-b border-green-800/40">
                <th className="py-2">Lote</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Fecha</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {consumos.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-green-800/20 hover:bg-green-900/10"
                >
                  <td className="py-2 text-green-300 font-semibold">
                    {c.lote?.nombre}
                  </td>

                  <td className="py-2 text-gray-200">
                    {c.producto?.nombre}
                  </td>

                  <td className="py-2">{c.cantidad}</td>

                  <td className="py-2">
                    {new Date(c.fecha).toLocaleDateString()}
                  </td>

                  <td className="py-2 flex justify-center gap-2">
                    <button
                      className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
                      onClick={() => {
                        setEditData(c);
                        setOpenModal(true);
                      }}
                    >
                      Editar
                    </button>

                    <button
                      className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
                      onClick={() => eliminar(c.id)}
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
        <ModalConsumo
          close={() => setOpenModal(false)}
          refresh={cargarConsumos}
          editData={editData}
        />
      )}
    </div>
  );
}
