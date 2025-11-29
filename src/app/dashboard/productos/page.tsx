"use client";

import { useEffect, useState, useTransition } from "react";
import ModalProducto from "@/components/productos/ModalProducto";
import ModalImportProductos from "@/components/modals/ModalImportProductos";

export default function ProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);

  const [openImport, setOpenImport] = useState(false);

  const [isPending, startTransition] = useTransition();

  const cargarProductos = async () => {
    setLoading(true);
    const res = await fetch("/api/productos");
    const json = await res.json();

    setProductos(json);
    setProductosFiltrados(json);
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // BUSCADOR
  useEffect(() => {
    const texto = search.toLowerCase();
    const filtrados = productos.filter((p) =>
      p.nombre.toLowerCase().includes(texto)
    );
    setProductosFiltrados(filtrados);
  }, [search, productos]);

  const eliminarProducto = async (id: number) => {
    if (!confirm("¿Eliminar producto?")) return;

    startTransition(async () => {
      await fetch(`/api/productos?id=${id}`, { method: "DELETE" });
      cargarProductos();
    });
  };

  const exportarExcel = () => {
    window.open("/api/export/productos", "_blank");
  };

  return (
    <div className="h-screen flex flex-col p-6 bg-[#0f1217] text-white overflow-hidden">

      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h1 className="text-4xl font-bold text-green-400">Productos</h1>

        <div className="flex gap-3">
          <button
            onClick={exportarExcel}
            className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl font-semibold shadow-lg"
          >
            Exportar Excel
          </button>

          <button
            onClick={() => setOpenImport(true)}
            className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-xl font-semibold shadow-lg"
          >
            Importar desde Excel
          </button>

          <button
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl"
            onClick={() => {
              setEditData(null);
              setOpenModal(true);
            }}
          >
            + Agregar producto
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="mb-4 flex-shrink-0">
        <input
          type="text"
          placeholder="Buscar producto..."
          className="w-full px-4 py-2 rounded-lg bg-[#1a1f25] border border-green-800/40 text-green-200 focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CONTENEDOR SCROLLEABLE */}
      <div className="flex-1 overflow-auto bg-[#1a1f25] p-4 rounded-xl border border-green-800/40 shadow-lg">
        {loading ? (
          <p className="text-gray-400">Cargando productos...</p>
        ) : productosFiltrados.length === 0 ? (
          <p className="text-gray-500">No hay productos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px] table-auto">
              <thead>
                <tr className="text-green-300 border-b border-green-800/40">
                  <th className="py-3">ID</th>
                  <th className="py-3">Nombre</th>
                  <th className="py-3">Unidad</th>
                  <th className="py-3">Stock</th>
                  <th className="py-3">Categoría</th>
                  <th className="py-3">Proveedor</th>
                  <th className="py-3 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {productosFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-green-800/20 hover:bg-green-900/10 transition"
                  >
                    <td className="py-3">{p.id}</td>
                    <td className="py-3 text-green-300 font-semibold">{p.nombre}</td>
                    <td className="py-3">{p.unidad}</td>

                    {/* COLOR PARA STOCK BAJO */}
                    <td
                      className={`py-3 font-bold ${
                        p.stock <= (p.stockMinimo || 0)
                          ? "text-red-400"
                          : "text-green-200"
                      }`}
                    >
                      {p.stock}
                    </td>

                    <td className="py-3">{p.categoria?.nombre || "-"}</td>
                    <td className="py-3">{p.proveedor?.nombre || "-"}</td>

                    <td className="py-3 flex gap-2 justify-center">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
                        onClick={() => {
                          setEditData(p);
                          setOpenModal(true);
                        }}
                      >
                        Editar
                      </button>

                      <button
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
                        onClick={() => eliminarProducto(p.id)}
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

      {/* MODAL AGREGAR/EDITAR */}
      {openModal && (
        <ModalProducto
          close={() => setOpenModal(false)}
          refresh={cargarProductos}
          editData={editData}
        />
      )}

      {/* MODAL DE IMPORTACIÓN */}
      {openImport && (
        <ModalImportProductos
          isOpen={openImport}
          onClose={() => setOpenImport(false)}
          onImported={cargarProductos}
        />
      )}
    </div>
  );
}
