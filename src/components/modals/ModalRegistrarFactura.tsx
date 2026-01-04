"use client";

export default function ModalRegistrarFactura({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111319] p-6 rounded-xl w-full max-w-lg border border-white/10">
        <h2 className="text-xl font-bold mb-4 text-green-400">
          Registrar factura
        </h2>

        <p className="text-sm text-gray-300 mb-4">
          Aquí va tu formulario manual de factura.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-600 px-4 py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
