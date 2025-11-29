"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function LotesHorizontal({ data }) {
  return (
    <div className="bg-[#0d1a0f] p-4 rounded-xl shadow-md">
      <h3 className="text-white mb-3 font-semibold">Consumos por Lote</h3>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid stroke="#224" />
          <XAxis type="number" stroke="#ccc" />
          <YAxis dataKey="lote" type="category" width={100} stroke="#ccc" />
          <Tooltip />
          <Bar dataKey="total" fill="#43a047" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
