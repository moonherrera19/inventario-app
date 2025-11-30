"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Tipo para los datos del gráfico
type ProveedorItem = {
  nombre: string;
  total: number;
};

// Props del componente
interface Props {
  data: ProveedorItem[];
}

export default function ProveedoresBar({ data }: Props) {
  return (
    <div className="bg-[#0d1a0f] p-4 rounded-xl shadow-md">
      <h3 className="text-white mb-3 font-semibold">
        Gastos por Proveedor (Mes)
      </h3>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="nombre" stroke="#a5d6a7" />
            <YAxis stroke="#a5d6a7" />
            <Tooltip />
            <Bar dataKey="total" fill="#00c853" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
