"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Tipo para cada producto del gráfico
type ProductoTopItem = {
  nombre: string;
  total: number;
};

interface Props {
  data: ProductoTopItem[];
}

export default function TopProductos({ data }: Props) {
  return (
    <div className="bg-[#0d1a0f] p-4 rounded-xl shadow-md">
      <h3 className="text-white mb-3 font-semibold">
        Top 5 Productos Más Usados
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
