"use client";


export default function Navbar() {
  return (
    <header className="w-full h-16 bg-[#0d1715] border-b border-[#1f2e2b] flex items-center justify-between px-6 text-white">
      <h1 className="text-xl font-bold text-green-400">Panel Principal</h1>

      <button
        onClick={() => (window.location.href = "/login")}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
