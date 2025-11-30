"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: any[]; // 👈 Corrección para evitar el error TS
}

export default function GraficaEntradasSalidas({ data }: Props) {
  return (
    <div className="bg-[#0d1a0f] p-4 rounded-xl shadow-md">
      <h3 className="text-white mb-3 font-semibold">
        Entradas vs Salidas (Semana)
      </h3>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#2a3f2e" strokeDasharray="3 3" />
            <XAxis dataKey="dia" stroke="#80ff9f" />
            <YAxis stroke="#80ff9f" />
            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="entradas"
              stroke="#4caf50"
              strokeWidth={3}
              dot={{ r: 5 }}
            />

            <Line
              type="monotone"
              dataKey="salidas"
              stroke="#ff5252"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
