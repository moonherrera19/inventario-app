"use client";

interface KpiCardProps {
  title: string;
  value: string | number;
  color?: "green" | "red" | "blue" | "yellow";
}

const colorMap = {
  green: "bg-green-600",
  red: "bg-red-600",
  blue: "bg-blue-600",
  yellow: "bg-yellow-600",
};

export default function KpiCard({ title, value, color = "green" }: KpiCardProps) {
  return (
    <div
      className={`${colorMap[color]} text-white p-5 rounded-xl shadow-md flex flex-col gap-2`}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
