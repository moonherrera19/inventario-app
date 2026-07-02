"use client";

import { useMemo, useState } from "react";

interface ProductoInventario {
  id: number;
  nombre: string;
  unidad: string;
  stock: number;
}

export default function InventarioFisicoPage() {
  // TEMPORAL
  // En el Sprint 2 estos datos vendrán desde la API.
  const [productos] = useState<ProductoInventario[]>([
    {
      id: 1,
      nombre: "ULTRASOL MICRO REXENE FE",
      unidad: "KG",
      stock: 223,
    },
    {
      id: 2,
      nombre: "AGRO K",
      unidad: "KG",
      stock: -48,
    },
    {
      id: 3,
      nombre: "CALCIO AGRIGROW",
      unidad: "KG",
      stock: -3850,
    },
  ]);

  const [buscar, setBuscar] = useState("");
  const [soloDiferencias, setSoloDiferencias] = useState(false);

  const [conteos, setConteos] = useState<Record<number, number>>({});

  const actualizarConteo = (id: number, valor: string) => {
    setConteos((prev) => ({
      ...prev,
      [id]: Number(valor),
    }));
  };

  const datos = useMemo(() => {
    return productos
      .map((p) => {
        const conteo = conteos[p.id] ?? p.stock;
        const diferencia = conteo - p.stock;

        return {
          ...p,
          conteo,
          diferencia,
        };
      })
      .filter((p) =>
        p.nombre.toLowerCase().includes(buscar.toLowerCase())
      )
      .filter((p) => {
        if (!soloDiferencias) return true;
        return p.diferencia !== 0;
      });
  }, [productos, conteos, buscar, soloDiferencias]);

  return (
    <div className="min-h-screen bg-[#0f1217] text-white p-8">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-bold text-green-400">
            Inventario Físico
          </h1>

          <p className="text-gray-400 mt-2">
            Capture el conteo físico del almacén.
          </p>
        </div>

        <button
          disabled
          className="bg-green-700 opacity-50 px-5 py-3 rounded-xl font-semibold"
        >
          Aplicar Ajustes
        </button>

      </div>

      <div className="flex gap-5 mb-8">

        <input
          placeholder="Buscar producto..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="flex-1 bg-[#1a1f25] border border-green-800 rounded-xl px-4 py-3"
        />

        <label className="flex items-center gap-2">

          <input
            type="checkbox"
            checked={soloDiferencias}
            onChange={(e) => setSoloDiferencias(e.target.checked)}
          />

          Solo diferencias

        </label>

      </div>

      <div className="overflow-auto rounded-xl border border-green-900">

        <table className="w-full">

          <thead className="bg-[#1a1f25]">

            <tr>

              <th className="text-left p-4">Producto</th>

              <th>Unidad</th>

              <th>Stock Sistema</th>

              <th>Conteo Físico</th>

              <th>Diferencia</th>

              <th>Estado</th>

            </tr>

          </thead>

          <tbody>

            {datos.map((p) => {

              const color =
                p.diferencia === 0
                  ? "text-green-400"
                  : p.diferencia > 0
                  ? "text-blue-400"
                  : "text-red-400";

              const estado =
                p.diferencia === 0
                  ? "Correcto"
                  : "Pendiente";

              return (

                <tr
                  key={p.id}
                  className="border-t border-gray-800 hover:bg-[#161b20]"
                >

                  <td className="p-4 font-medium">
                    {p.nombre}
                  </td>

                  <td className="text-center">
                    {p.unidad}
                  </td>

                  <td className="text-center">
                    {p.stock.toFixed(2)}
                  </td>

                  <td className="text-center">

                    <input
                      type="number"
                      step="0.01"
                      value={p.conteo}
                      onChange={(e) =>
                        actualizarConteo(
                          p.id,
                          e.target.value
                        )
                      }
                      className="w-28 text-center bg-[#0f1217] border border-green-800 rounded-lg py-2"
                    />

                  </td>

                  <td className={`text-center font-bold ${color}`}>
                    {p.diferencia.toFixed(2)}
                  </td>

                  <td className={`text-center ${color}`}>
                    {estado}
                  </td>

                </tr>

              );
            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}