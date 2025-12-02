"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const path = usePathname();

  const linkClass = (route) =>
    `block px-4 py-2 rounded-lg mb-1 transition ${
      path === route
        ? "bg-green-700 text-white"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`;

  return (
    <aside className="w-60 bg-[#0c0e11] h-screen p-4 border-r border-gray-800">
      <h2 className="text-xl font-bold mb-6 text-green-400">
        Inventario
      </h2>

      <nav className="flex flex-col space-y-1">

        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>

        <Link href="/productos" className={linkClass("/productos")}>
          Productos
        </Link>

        <Link href="/categorias" className={linkClass("/categorias")}>
          Categorías
        </Link>

        <Link href="/proveedores" className={linkClass("/proveedores")}>
          Proveedores
        </Link>

        <Link href="/entradas" className={linkClass("/entradas")}>
          Entradas
        </Link>

        <Link href="/salidas" className={linkClass("/salidas")}>
          Salidas
        </Link>

        <Link href="/compras" className={linkClass("/compras")}>
          Compras
        </Link>

        <Link href="/recetas" className={linkClass("/recetas")}>
          Recetas
        </Link>

        <Link href="/reportes" className={linkClass("/reportes")}>
          Reportes
        </Link>

      </nav>
    </aside>
  );
}
