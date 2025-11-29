"use client";

import { useState, useEffect } from "react";

export default function ModalProducto({ close, refresh, editData }: any) {
  // Campos
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("");
  const [categoriaId, setCategoriaId] = useState<any>(null);
  const [proveedorId, setProveedorId] = useState<any>(null);
  const [precioUnitario, setPrecioUnitario] = useState<any>("");
  const [stockMinimo, setStockMinimo] = useState<any>("0");

  // Catálogos
  const [categorias, setCategorias] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);

  // Validaciones
  const [errores, setErrores] = useState<any>({});

  // ========================================================
  // Cargar catálogos y datos si estamos editando
  // ========================================================
  const cargarCatalogos = async () => {
    const cat = await fetch("/api/categorias").then((r) => r.json());
    const prov = await fetch("/api/proveedores").then((r) => r.json());
    setCategorias(cat);
    setProveedores(prov);
  };

  useEffect(() => {
    cargarCatalogos();

    if (editData) {
      setNombre(editData.nombre);
      setUnidad(editData.unidad);
      setCategoriaId(editData.categoriaId);
      setProveedorId(editData.proveedorId);
      setPrecioUnitario(editData.precioUnitario || "");
      setStockMinimo(editData.stockMinimo?.toString() || "0");
    }
  }, []);

  // ========================================================
  // VALIDACIONES
  // ========================================================
  useEffect(() => {
    const newErrors: any = {};

    // Nombre obligatorio
    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";

    // Unidad obligatoria
    if (!unidad.trim()) newErrors.unidad = "La unidad es obligatoria.";

    // Precio debe ser ≥ 0
    if (precioUnitario !== "" && Number(precioUnitario) < 0)
      newErrors.precioUnitario = "El precio debe ser mayor o igual a 0.";

    // Stock mínimo ≥ 0
    if (stockMinimo !== "" && Number(stockMinimo) < 0)
      newErrors.stockMinimo = "El stock mínimo no puede ser negativo.";

    setErrores(newErrors);
  }, [nombre, unidad, precioUnitario, stockMinimo]);

  // ========================================================
  // Guardar (POST / PUT)
  // ========================================================
  const guardar = async () => {
    // Si hay errores, no enviar nada
    if (Object.keys(errores).length > 0)
      return alert("Corrige los errores antes de guardar.");

    const body = {
      nombre: nombre.trim(),
      unidad: unidad.trim(),
      categoriaId: categoriaId || null,
      proveedorId: proveedorId || null,
      precioUnitario: precioUnitario ? Number(precioUnitario) : null,
      stockMinimo: stockMinimo ? Number(stockMinimo) : 0,
    };

    const res = await fetch("/api/productos", {
      method: editData ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData ? { ...body, id: editData.id } : body),
    });

    if (!res.ok) return alert("❌ Error al guardar el producto");

    refresh();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-[#1a1f25] p-6 rounded-xl border border-green-900/40 w-[420px] shadow-xl">
        <h2 className="text-2xl text-green-300 font-bold mb-4">
          {editData ? "Editar producto" : "Nuevo producto"}
        </h2>

        <div className="space-y-3">

          {/* Nombre */}
          <div>
            <input
              placeholder="Nombre"
              className="w-full p-2 rounded bg-black/40 border border-green-800"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {errores.nombre && (
              <p className="text-red-400 text-sm">{errores.nombre}</p>
            )}
          </div>

          {/* Unidad */}
          <div>
            <input
              placeholder="Unidad (kg, L, pz)"
              className="w-full p-2 rounded bg-black/40 border border-green-800"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
            />
            {errores.unidad && (
              <p className="text-red-400 text-sm">{errores.unidad}</p>
            )}
          </div>

          {/* Categoría */}
          <select
            className="w-full p-2 rounded bg-black/40 border border-green-800"
            value={categoriaId || ""}
            onChange={(e) => setCategoriaId(Number(e.target.value))}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          {/* Proveedor */}
          <select
            className="w-full p-2 rounded bg-black/40 border border-green-800"
            value={proveedorId || ""}
            onChange={(e) => setProveedorId(Number(e.target.value))}
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          {/* Precio */}
          <div>
            <input
              placeholder="Precio unitario"
              type="number"
              className="w-full p-2 rounded bg-black/40 border border-green-800"
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(e.target.value)}
              min={0}
            />
            {errores.precioUnitario && (
              <p className="text-red-400 text-sm">{errores.precioUnitario}</p>
            )}
          </div>

          {/* Stock mínimo */}
          <div>
            <input
              placeholder="Stock mínimo"
              type="number"
              className="w-full p-2 rounded bg-black/40 border border-green-800"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              min={0}
            />
            {errores.stockMinimo && (
              <p className="text-red-400 text-sm">{errores.stockMinimo}</p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end mt-6 gap-3">
          <button
            className="px-4 py-2 bg-gray-700 rounded"
            onClick={close}
          >
            Cancelar
          </button>

          <button
            className={`px-4 py-2 rounded text-white ${
              Object.keys(errores).length > 0
                ? "bg-green-900 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            disabled={Object.keys(errores).length > 0}
            onClick={guardar}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
