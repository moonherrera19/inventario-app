"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded-lg font-medium transition ${
      pathname.startsWith(path)
        ? "text-green-400 bg-green-900/20"
        : "text-gray-300 hover:text-white hover:bg-green-900/10"
    }`;

  return (
    <div className="w-64 min-h-screen bg-[#0c1117] border-r border-green-800/30 p-6">
      <h2 className="text-3xl font-bold text-green-400 mb-8">Inventario</h2>

      <nav className="flex flex-col gap-3">

        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>

        <Link href="/dashboard/productos" className={linkClass("/dashboard/productos")}>
          Productos
        </Link>

        <Link href="/dashboard/categorias" className={linkClass("/dashboard/categorias")}>
          Categorías
        </Link>

        <Link href="/dashboard/proveedores" className={linkClass("/dashboard/proveedores")}>
          Proveedores
        </Link>

        <Link href="/dashboard/entradas" className={linkClass("/dashboard/entradas")}>
          Entradas
        </Link>

        <Link href="/dashboard/salidas" className={linkClass("/dashboard/salidas")}>
          Salidas
        </Link>

        <Link href="/dashboard/compras" className={linkClass("/dashboard/compras")}>
          Compras
        </Link>

        <Link href="/dashboard/recetas" className={linkClass("/dashboard/recetas")}>
          Recetas
        </Link>

        <Link href="/dashboard/consumos" className={linkClass("/dashboard/consumos")}>
          Consumos por lote
        </Link>

        <Link href="/dashboard/lotes" className={linkClass("/dashboard/lotes")}>
          Lotes agrícolas
        </Link>

        <Link href="/dashboard/reportes" className={linkClass("/dashboard/reportes")}>
          Reportes
        </Link>

        <div className="mt-6 border-t border-green-900/40 pt-4">
          <Link href="/dashboard/configuracion" className={linkClass("/dashboard/configuracion")}>
            Configuración
          </Link>

          <Link href="/dashboard/usuarios" className={linkClass("/dashboard/usuarios")}>
            Usuarios
          </Link>

          <Link href="/dashboard/roles" className={linkClass("/dashboard/roles")}>
            Roles
          </Link>
        </div>
      </nav>
    </div>
  );
}
