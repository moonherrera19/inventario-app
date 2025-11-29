export default function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-[#13201d] border border-[#1f332d] p-6 rounded-xl shadow-md text-white">
      <h3 className="text-lg text-green-300">{title}</h3>
      <p className="text-3xl font-bold mt-2 text-green-400">{value}</p>
    </div>
  );
}
