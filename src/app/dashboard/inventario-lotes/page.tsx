"use client";

import { useEffect, useState } from "react";

type LoteInventario = {
  id: number;
  loteCodigo: string;
  fechaCaducidad: string | null;
  cantidadDisponible: number;
  producto: {
    nombre: string;
    unidad: string;
  };
};

export default function InventarioLotesPage() {
  const [lotes, setLotes] = useState<LoteInventario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarLotes = async () => {
      try {
        const res = await fetch("/api/inventario-lotes");
        const data = await res.json();
        setLotes(data);
      } catch (error) {
        console.error("Error cargando inventario por lote", error);
      } finally {
        setLoading(false);
      }
    };

    cargarLotes();
  }, []);

  // ===========================
  // CLASIFICAR CADUCIDAD
  // ===========================
  const hoy = new Date();

  const vencidos = lotes.filter((l) => {
    if (!l.fechaCaducidad) return false;
    return new Date(l.fechaCaducidad) < hoy;
  });

  const porVencer = lotes.filter((l) => {
    if (!l.fechaCaducidad) return false;
    const diff =
      (new Date(l.fechaCaducidad).getTime() - hoy.getTime()) /
      (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const proximos = lotes.filter((l) => {
    if (!l.fechaCaducidad) return false;
    const diff =
      (new Date(l.fechaCaducidad).getTime() - hoy.getTime()) /
      (1000 * 60 * 60 * 24);
    return diff > 7 && diff <= 15;
  });

  const obtenerEstado = (fecha: string | null) => {
    if (!fecha) return { label: "Sin caducidad", color: "text-gray-400" };

    const diff =
      (new Date(fecha).getTime() - hoy.getTime()) /
      (1000 * 60 * 60 * 24);

    if (diff < 0) return { label: "Vencido", color: "text-red-400" };
    if (diff <= 7) return { label: "Por vencer", color: "text-orange-400" };
    if (diff <= 15) return { label: "Próximo", color: "text-yellow-400" };

    return { label: "OK", color: "text-green-400" };
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6 text-green-400">
        📦 Inventario por Lote
      </h1>

      {/* =======================
          ALERTAS / NOTIFICACIONES
      ======================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1a0f0f] border border-red-800 p-4 rounded-lg">
          <p className="text-red-400 font-bold text-lg">
            🔴 Vencidos
          </p>
          <p className="text-3xl font-extrabold">
            {vencidos.length}
          </p>
        </div>

        <div className="bg-[#1a140f] border border-orange-800 p-4 rounded-lg">
          <p className="text-orange-400 font-bold text-lg">
            🟠 Por vencer (7 días)
          </p>
          <p className="text-3xl font-extrabold">
            {porVencer.length}
          </p>
        </div>

        <div className="bg-[#141a0f] border border-yellow-800 p-4 rounded-lg">
          <p className="text-yellow-400 font-bold text-lg">
            🟡 Próximos (15 días)
          </p>
          <p className="text-3xl font-extrabold">
            {proximos.length}
          </p>
        </div>
      </div>

      {/* =======================
          TABLA INVENTARIO
      ======================== */}
      {loading ? (
        <p className="text-gray-400">Cargando inventario...</p>
      ) : lotes.length === 0 ? (
        <p className="text-gray-400">No hay inventario disponible.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-green-800/40 rounded-lg">
            <thead className="bg-[#0f171f]">
              <tr>
                <th className="p-2 border">Producto</th>
                <th className="p-2 border">Lote</th>
                <th className="p-2 border">Caducidad</th>
                <th className="p-2 border">Disponible</th>
                <th className="p-2 border">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => {
                const estado = obtenerEstado(lote.fechaCaducidad);

                return (
                  <tr key={lote.id} className="hover:bg-[#142017]">
                    <td className="p-2 border">
                      {lote.producto.nombre}
                    </td>
                    <td className="p-2 border">
                      {lote.loteCodigo}
                    </td>
                    <td className="p-2 border">
                      {lote.fechaCaducidad
                        ? new Date(lote.fechaCaducidad).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-2 border text-right">
                      {lote.cantidadDisponible} {lote.producto.unidad}
                    </td>
                    <td className={`p-2 border font-semibold ${estado.color}`}>
                      {estado.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
