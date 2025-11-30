"use client";

interface ModalIngredienteProps {
  open: boolean;
  onClose: () => void;
  productos: any[];
  ingredientesActuales: any[];
  onAdd: (ingrediente: any) => void;
}

export default function ModalIngrediente({
  open,
  onClose,
  productos,
  ingredientesActuales,
  onAdd,
}: ModalIngredienteProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0f1217] p-6 rounded-xl border border-green-700 w-full max-w-lg text-white">

        <h2 className="text-xl font-bold text-green-400 mb-4">
          Agregar ingrediente
        </h2>

        <select
          className="bg-[#1a1f25] border border-green-700 p-2 rounded w-full mb-4"
          id="producto"
        >
          <option value="">Selecciona un producto</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Cantidad"
          className="bg-[#1a1f25] border border-green-700 p-2 rounded w-full mb-4"
          id="cantidad"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>

          <button
            onClick={() => {
              const prodSelect = document.getElementById(
                "producto"
              ) as HTMLSelectElement;

              const cantInput = document.getElementById(
                "cantidad"
              ) as HTMLInputElement;

              if (!prodSelect.value || !cantInput.value) {
                alert("Completa todos los campos");
                return;
              }

              const ingrediente = {
                productoId: Number(prodSelect.value),
                cantidad: Number(cantInput.value),
              };

              onAdd(ingrediente);
              onClose();
            }}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
