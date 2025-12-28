"use client";

import { useEffect, useState, useTransition } from "react";

export default function ModalProveedor({ close, refresh, editData }: any) {
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
    rfc: "",

    banco: "",
    numeroCuenta: "",
    clabe: "",

    bancoDolares: "",
    numeroCuentaDolares: "",
    clabeDolares: "",
  });

  // ------------------------------------------------------
  // CARGAR DATOS SI ES EDICIÓN
  // ------------------------------------------------------
  useEffect(() => {
    if (editData) {
      setForm({
        nombre: editData.nombre || "",
        telefono: editData.telefono || "",
        correo: editData.correo || "",
        direccion: editData.direccion || "",
        rfc: editData.rfc || "",

        banco: editData.banco || "",
        numeroCuenta: editData.numeroCuenta || "",
        clabe: editData.clabe || "",

        bancoDolares: editData.bancoDolares || "",
        numeroCuentaDolares: editData.numeroCuentaDolares || "",
        clabeDolares: editData.clabeDolares || "",
      });
    }
  }, [editData]);

  // ------------------------------------------------------
  // HANDLE CHANGE
  // ------------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ------------------------------------------------------
  // GUARDAR / EDITAR
  // ------------------------------------------------------
  const guardar = () => {
    if (!form.nombre.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/proveedores", {
          method: editData ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editData ? { id: editData.id, ...form } : form
          ),
        });

        if (!res.ok) {
          throw new Error("Error al guardar proveedor");
        }

        refresh();
        close();
      } catch (error) {
        console.error(error);
        alert("Ocurrió un error al guardar.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-[#1a1f25] w-full max-w-xl p-6 rounded-xl border border-green-700 shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold text-green-400 mb-4">
          {editData ? "Editar proveedor" : "Nuevo proveedor"}
        </h2>

        {/* DATOS GENERALES */}
        <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
        <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
        <Input label="Correo" name="correo" value={form.correo} onChange={handleChange} />
        <Input label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} />
        <Input label="RFC" name="rfc" value={form.rfc} onChange={handleChange} />

        <hr className="border-green-800/40 my-4" />

        {/* DATOS BANCARIOS MXN */}
        <h3 className="text-green-300 font-semibold mb-2">
          Datos bancarios (MXN)
        </h3>
        <Input label="Banco" name="banco" value={form.banco} onChange={handleChange} />
        <Input label="Número de cuenta" name="numeroCuenta" value={form.numeroCuenta} onChange={handleChange} />
        <Input label="CLABE" name="clabe" value={form.clabe} onChange={handleChange} />

        {/* DATOS BANCARIOS USD */}
        <h3 className="text-green-300 font-semibold mt-4 mb-2">
          Datos bancarios (USD)
        </h3>
        <Input label="Banco USD" name="bancoDolares" value={form.bancoDolares} onChange={handleChange} />
        <Input label="Cuenta USD" name="numeroCuentaDolares" value={form.numeroCuentaDolares} onChange={handleChange} />
        <Input label="CLABE USD" name="clabeDolares" value={form.clabeDolares} onChange={handleChange} />

        {/* BOTONES */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={close}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={guardar}
            disabled={isPending}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            {isPending ? "Guardando..." : editData ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------
// INPUT REUTILIZABLE
// ------------------------------------------------------
function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="mb-3">
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2 bg-[#0f1217] border border-green-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-600"
      />
    </div>
  );
}
