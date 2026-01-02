"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import ModalProveedor from "@/components/proveedores/ModalProveedor";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);

  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // ======================================================
  // CARGAR PROVEEDORES
  // ======================================================
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

  // ======================================================
  // FILTRO DE BÚSQUEDA
  // ======================================================
  const proveedoresFiltrados = useMemo(() => {
    if (!search.trim()) return proveedores;

    const q = search.toLowerCase();

    return proveedores.filter((p) =>
      [
        p.nombre,
        p.banco,
        p.bancoDolares,
        p.rfc,
      ]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
    );
  }, [search, proveedores]);

  // ======================================================
  // IMPORTAR EXCEL
  // ======================================================
  const importarExcel = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await fetch("/api/proveedores/import", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error();

        const json = await res.json();

        alert(
          `Importación completada\n\n` +
          `Creados: ${json.creados ?? 0}\n` +
          `Duplicados: ${json.duplicados ?? 0}`
        );

        cargarProveedores();
      } catch {
        alert("Error al importar proveedores");
      }
    });
  };

  // ======================================================
  // ELIMINAR
  // ======================================================
  const eliminarProveedor = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este proveedor?")) return;

    startTransition(async () => {
      try {
        await fetch(`/api/proveedores?id=${id}`, { method: "DELETE" });
        cargarProveedores();
      } catch {
        alert("Error al eliminar proveedor");
      }
    });
  };

  return (
    <div className="min-h-screen p-6 bg-[#0f1217] text-white">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-4xl font-bold text-green-400">Proveedores</h1>

        <div className="flex gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            id="importExcel"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importarExcel(file);
              e.currentTarget.value = "";
            }}
          />

          <label
            htmlFor="importExcel"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold cursor-pointer"
          >
            Importar Excel
          </label>

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

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-[#1a1f25] rounded-xl border border-green-800/40 shadow-lg p-4">

        {/* BUSCADOR */}
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, banco o RFC…"
            className="w-full md:w-96 px-4 py-2 rounded-lg bg-[#0f1217] border border-green-800/40 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* TABLA */}
        {loading ? (
          <p className="text-gray-400">Cargando proveedores…</p>
        ) : proveedoresFiltrados.length === 0 ? (
          <p className="text-gray-400">No hay resultados.</p>
        ) : (
          <div className="max-h-[65vh] overflow-auto rounded-lg">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="sticky top-0 bg-[#1a1f25] z-10">
                <tr className="text-green-300 border-b border-green-800/40">
                  <th className="py-3">Nombre</th>
                  <th>Banco MXN</th>
                  <th>Cuenta MXN</th>
                  <th>CLABE MXN</th>
                  <th>Banco USD</th>
                  <th>Cuenta USD</th>
                  <th>CLABE USD</th>
                  <th>RFC</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {proveedoresFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-green-800/20 hover:bg-green-900/10"
                  >
                    <td className="font-semibold text-green-400 py-2">
                      {p.nombre}
                    </td>
                    <td>{p.banco || "-"}</td>
                    <td>{p.numeroCuenta || "-"}</td>
                    <td>{p.clabe || "-"}</td>
                    <td>{p.bancoDolares || "-"}</td>
                    <td>{p.numeroCuentaDolares || "-"}</td>
                    <td>{p.clabeDolares || "-"}</td>
                    <td>{p.rfc || "-"}</td>

                    <td className="flex gap-2 justify-center py-2">
                      <button
                        onClick={() => {
                          setEditData(p);
                          setOpenModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => eliminarProveedor(p.id)}
                        disabled={isPending}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md"
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
