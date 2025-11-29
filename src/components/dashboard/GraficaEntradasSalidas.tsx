"use client";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function GraficaEntradasSalidas({ data }) {
  return (
    <div className="bg-[#0d1a0f] p-4 rounded-xl shadow-md">
      <h3 className="text-white mb-3 font-semibold">
        Entradas vs Salidas – Últimos 7 días
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="entradas" stroke="#00c853" strokeWidth={3} />
          <Line type="monotone" dataKey="salidas" stroke="#ff5252" strokeWidth={3} />
          <CartesianGrid stroke="#223" />
          <XAxis dataKey="dia" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
