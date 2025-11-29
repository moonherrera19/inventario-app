export default function KpiCard({ title, value, color = "green" }) {
  return (
    <div
      className={`bg-${color}-600 text-white p-5 rounded-xl shadow-md flex flex-col gap-2`}
    >
      <span className="text-sm opacity-90">{title}</span>
      <span className="text-3xl font-bold">{value}</span>
    </div>
  );
}
