"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// -------------------------------------------------
// TIPOS CORREGIDOS
// -------------------------------------------------
interface CategoriaItem {
  nombre: string;
  total: number;

  // 👇 Requisito de Recharts para evitar errores TS
  [key: string]: any;
}

interface Props {
  data: CategoriaItem[];
}

const COLORS = ["#00c853", "#2e7d32", "#1b5e20", "#81c784", "#4caf50"];

export default function CategoriasDonut({ data }: Props) {
  return (
    <div className="bg-[#0d1a0f] p-4 rounded-xl shadow-md">
      <h3 className="text-white mb-3 font-semibold">
        Inventario por Categoría
      </h3>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}        // ← YA NO FALLA
              dataKey="total"
              nameKey="nombre"
              outerRadius={80}
            >
              {data?.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
