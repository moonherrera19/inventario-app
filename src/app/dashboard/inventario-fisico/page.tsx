"use client";

import { useEffect, useMemo, useState } from "react";

/* ==================================================
   TIPOS
================================================== */

interface ProductoInventario {
  id: number;
  nombre: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  manejaLotes: boolean;
}

interface InventarioFisicoApiSuccess {
  success: true;
  data: ProductoInventario[];
}

interface InventarioFisicoApiError {
  success: false;
  message: string;
}

type InventarioFisicoApiResponse =
  | InventarioFisicoApiSuccess
  | InventarioFisicoApiError;

interface ConteoEntry {
  valor: string; // vacío = aún no capturado
  revisado: boolean;
}

type Movimiento = "Entrada" | "Salida" | "Ninguno" | "Sin capturar";

type EstadoLabel = "Correcto" | "Pendiente" | "Stock Negativo";

interface FilaInventario extends ProductoInventario {
  conteoValor: string;
  conteoNumero: number | null;
  diferencia: number | null;
  movimiento: Movimiento;
  estado: EstadoLabel;
  revisado: boolean;
  esNegativo: boolean;
  esBajoMinimo: boolean;
}

interface Filtros {
  buscar: string;
  unidad: string;
  soloDiferencias: boolean;
  soloNegativos: boolean;
  soloBajoMinimo: boolean;
  soloRevisados: boolean;
  soloPendientes: boolean;
}

/* ==================================================
   HELPERS
================================================== */

function calcularMovimiento(diferencia: number | null): Movimiento {
  if (diferencia === null) return "Sin capturar";
  if (diferencia > 0) return "Entrada";
  if (diferencia < 0) return "Salida";
  return "Ninguno";
}

function calcularEstado(
  diferencia: number | null,
  stockNegativo: boolean
): EstadoLabel {
  if (diferencia === null) {
    return stockNegativo ? "Stock Negativo" : "Pendiente";
  }
  return diferencia === 0 ? "Correcto" : "Pendiente";
}

function colorEstado(estado: EstadoLabel): string {
  switch (estado) {
    case "Correcto":
      return "bg-green-500/15 text-green-400 border border-green-700";
    case "Pendiente":
      return "bg-yellow-500/15 text-yellow-400 border border-yellow-700";
    case "Stock Negativo":
      return "bg-red-500/15 text-red-400 border border-red-700";
  }
}

function colorMovimiento(mov: Movimiento): string {
  switch (mov) {
    case "Entrada":
      return "text-blue-400";
    case "Salida":
      return "text-orange-400";
    case "Ninguno":
      return "text-gray-400";
    case "Sin capturar":
      return "text-gray-600";
  }
}

function sanitizarConteo(valorCrudo: string): string {
  // Nunca se permite un valor negativo.
  let valor = valorCrudo.replace(/-/g, "");
  // Evita múltiples puntos decimales.
  const partes = valor.split(".");
  if (partes.length > 2) {
    valor = `${partes[0]}.${partes.slice(1).join("")}`;
  }
  return valor;
}

/* ==================================================
   COMPONENTE
================================================== */

export default function InventarioFisicoPage() {
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [conteos, setConteos] = useState<Record<number, ConteoEntry>>({});

  const [filtros, setFiltros] = useState<Filtros>({
    buscar: "",
    unidad: "",
    soloDiferencias: false,
    soloNegativos: false,
    soloBajoMinimo: false,
    soloRevisados: false,
    soloPendientes: false,
  });

  const [mostrarResumen, setMostrarResumen] = useState<boolean>(false);
  const [aplicando, setAplicando] = useState<boolean>(false);
  const [errorAjuste, setErrorAjuste] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  /* -------------------- FETCH -------------------- */

  async function cargarProductos(): Promise<void> {
    setCargando(true);
    setError(null);

    try {
      const res = await fetch("/api/inventario-fisico", {
        method: "GET",
        cache: "no-store",
      });

      const json: InventarioFisicoApiResponse = await res.json();

      if (!json.success) {
        setError(json.message);
        setProductos([]);
        return;
      }

      setProductos(json.data);
    } catch {
      setError("No fue posible conectar con el servidor.");
      setProductos([]);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarProductos();
  }, []);

  /* -------------------- ACCIONES -------------------- */

  function actualizarConteo(id: number, valorCrudo: string): void {
    const valor = sanitizarConteo(valorCrudo);

    setConteos((prev) => ({
      ...prev,
      [id]: {
        valor,
        revisado: prev[id]?.revisado ?? false,
      },
    }));
  }

  function actualizarRevisado(id: number, revisado: boolean): void {
    setConteos((prev) => ({
      ...prev,
      [id]: {
        valor: prev[id]?.valor ?? "",
        revisado,
      },
    }));
  }

  function actualizarFiltro<K extends keyof Filtros>(
    campo: K,
    valor: Filtros[K]
  ): void {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleAplicarAjustes(): void {
    setErrorAjuste(null);
    setMensajeExito(null);

    const revisados = filas.filter((f) => f.revisado);

    if (revisados.length === 0) {
      setErrorAjuste("No hay productos revisados para aplicar.");
      return;
    }

    const sinConteo = revisados.filter((f) => f.conteoNumero === null);
    if (sinConteo.length > 0) {
      setErrorAjuste(
        `Hay ${sinConteo.length} producto(s) revisado(s) sin conteo físico capturado.`
      );
      return;
    }

    const conNegativo = revisados.filter(
      (f) => f.conteoNumero !== null && f.conteoNumero < 0
    );
    if (conNegativo.length > 0) {
      setErrorAjuste(
        `Hay ${conNegativo.length} producto(s) con un conteo físico negativo, lo cual no es válido.`
      );
      return;
    }

    const idsVistos = new Set<number>();
    for (const fila of revisados) {
      if (idsVistos.has(fila.id)) {
        setErrorAjuste(`El producto "${fila.nombre}" está duplicado.`);
        return;
      }
      idsVistos.add(fila.id);
    }

    setMostrarResumen(true);
  }

  async function confirmarAplicarAjustes(): Promise<void> {
    setAplicando(true);
    setErrorAjuste(null);

    try {
      const payload: { productoId: number; conteoFisico: number }[] = filas
        .filter((f) => f.revisado && f.conteoNumero !== null)
        .map((f) => ({
          productoId: f.id,
          conteoFisico: f.conteoNumero as number,
        }));

      const res = await fetch("/api/inventario-fisico/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: {
        success: boolean;
        entradas?: number;
        salidas?: number;
        sinCambios?: number;
        message?: string;
      } = await res.json();

      if (!json.success) {
        setErrorAjuste(json.message ?? "No fue posible aplicar los ajustes.");
        return;
      }

      // Limpia el conteo/revisado únicamente de los productos que se
      // acaban de procesar, sin recargar la página.
      const idsAplicados = new Set(payload.map((p) => p.productoId));
      setConteos((prev) => {
        const nuevo = { ...prev };
        idsAplicados.forEach((id) => {
          delete nuevo[id];
        });
        return nuevo;
      });

      // Refresca productos (stock actualizado por el motor de Entradas/Salidas)
      // para que Dashboard, tabla y KPIs se actualicen solos.
      await cargarProductos();

      setMostrarResumen(false);
      setMensajeExito(
        `Inventario actualizado correctamente. Entradas: ${json.entradas}, Salidas: ${json.salidas}, Sin cambios: ${json.sinCambios}.`
      );
    } catch {
      setErrorAjuste("No fue posible conectar con el servidor.");
    } finally {
      setAplicando(false);
    }
  }

  /* -------------------- DATOS DERIVADOS -------------------- */

  const filas: FilaInventario[] = useMemo(() => {
    return productos.map((producto) => {
      const entry = conteos[producto.id];
      const conteoValor = entry?.valor ?? "";
      const conteoNumero = conteoValor === "" ? null : Number(conteoValor);
      const diferencia =
        conteoNumero === null ? null : conteoNumero - producto.stock;

      const esNegativo = producto.stock < 0;
      const esBajoMinimo = producto.stock < producto.stockMinimo;

      const estado = calcularEstado(diferencia, esNegativo);
      const movimiento = calcularMovimiento(diferencia);

      return {
        ...producto,
        conteoValor,
        conteoNumero,
        diferencia,
        movimiento,
        estado,
        revisado: entry?.revisado ?? false,
        esNegativo,
        esBajoMinimo,
      };
    });
  }, [productos, conteos]);

  const unidadesDisponibles: string[] = useMemo(() => {
    const set = new Set<string>();
    productos.forEach((p) => set.add(p.unidad));
    return Array.from(set).sort();
  }, [productos]);

  const filasFiltradas: FilaInventario[] = useMemo(() => {
    const busquedaNormalizada = filtros.buscar.trim().toLowerCase();

    return filas.filter((fila) => {
      if (
        busquedaNormalizada &&
        !fila.nombre.toLowerCase().includes(busquedaNormalizada)
      ) {
        return false;
      }

      if (filtros.unidad && fila.unidad !== filtros.unidad) return false;

      if (filtros.soloDiferencias && (fila.diferencia === null || fila.diferencia === 0)) {
        return false;
      }

      if (filtros.soloNegativos && !fila.esNegativo) return false;

      if (filtros.soloBajoMinimo && !fila.esBajoMinimo) return false;

      if (filtros.soloRevisados && !fila.revisado) return false;

      if (filtros.soloPendientes && fila.estado !== "Pendiente") return false;

      return true;
    });
  }, [filas, filtros]);

  const kpis = useMemo(() => {
    const totales = filas.length;
    const revisados = filas.filter((f) => f.revisado).length;
    const pendientes = filas.filter((f) => f.estado === "Pendiente").length;
    const conDiferencias = filas.filter(
      (f) => f.diferencia !== null && f.diferencia !== 0
    ).length;
    const stockNegativo = filas.filter((f) => f.esNegativo).length;
    const stockBajo = filas.filter((f) => f.esBajoMinimo).length;

    return {
      totales,
      revisados,
      pendientes,
      conDiferencias,
      stockNegativo,
      stockBajo,
    };
  }, [filas]);

  const resumenAjustes = useMemo(() => {
    const entradas = filas.filter(
      (f) => f.revisado && f.movimiento === "Entrada"
    ).length;
    const salidas = filas.filter(
      (f) => f.revisado && f.movimiento === "Salida"
    ).length;
    const sinCambios = filas.length - entradas - salidas;

    return { entradas, salidas, sinCambios };
  }, [filas]);

  /* -------------------- RENDER -------------------- */

  return (
    <div className="min-h-screen bg-[#0f1217] text-white p-6 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-green-400">
            Inventario Físico
          </h1>
          <p className="text-gray-400 mt-2">
            Capture el conteo físico del almacén y reconcilie el inventario
            del sistema con el inventario real.
          </p>
        </div>
      </div>

      {errorAjuste && (
        <div className="mb-6 rounded-xl border border-red-800 bg-red-950/30 text-red-300 px-4 py-3">
          {errorAjuste}
        </div>
      )}

      {mensajeExito && (
        <div className="mb-6 rounded-xl border border-green-800 bg-green-950/30 text-green-300 px-4 py-3">
          {mensajeExito}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        <KpiCard titulo="Productos Totales" valor={kpis.totales} />
        <KpiCard titulo="Revisados" valor={kpis.revisados} color="text-green-400" />
        <KpiCard titulo="Pendientes" valor={kpis.pendientes} color="text-yellow-400" />
        <KpiCard titulo="Con Diferencias" valor={kpis.conDiferencias} color="text-blue-400" />
        <KpiCard titulo="Stock Negativo" valor={kpis.stockNegativo} color="text-red-400" />
        <KpiCard titulo="Stock Bajo" valor={kpis.stockBajo} color="text-orange-400" />
        <KpiCard
          titulo="Último Conteo"
          valor="—"
          color="text-gray-500"
          subtitulo="Disponible en Sprint 4"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-4 mb-6 bg-[#151a20] border border-gray-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            placeholder="Buscar producto..."
            value={filtros.buscar}
            onChange={(e) => actualizarFiltro("buscar", e.target.value)}
            className="flex-1 bg-[#1a1f25] border border-green-800 rounded-xl px-4 py-3 outline-none focus:border-green-500"
          />

          <select
            value={filtros.unidad}
            onChange={(e) => actualizarFiltro("unidad", e.target.value)}
            className="bg-[#1a1f25] border border-green-800 rounded-xl px-4 py-3 outline-none focus:border-green-500"
          >
            <option value="">Unidad ▾</option>
            {unidadesDisponibles.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <select
            disabled
            title="Requiere campo Categoría en el modelo Producto (pendiente)"
            className="bg-[#1a1f25] border border-gray-800 text-gray-600 rounded-xl px-4 py-3 cursor-not-allowed"
          >
            <option>Categoría ▾</option>
          </select>

          <select
            disabled
            title="Requiere campo Proveedor en el modelo Producto (pendiente)"
            className="bg-[#1a1f25] border border-gray-800 text-gray-600 rounded-xl px-4 py-3 cursor-not-allowed"
          >
            <option>Proveedor ▾</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-gray-300">
          <CheckboxFiltro
            label="Solo diferencias"
            checked={filtros.soloDiferencias}
            onChange={(v) => actualizarFiltro("soloDiferencias", v)}
          />
          <CheckboxFiltro
            label="Solo negativos"
            checked={filtros.soloNegativos}
            onChange={(v) => actualizarFiltro("soloNegativos", v)}
          />
          <CheckboxFiltro
            label="Solo bajo mínimo"
            checked={filtros.soloBajoMinimo}
            onChange={(v) => actualizarFiltro("soloBajoMinimo", v)}
          />
          <CheckboxFiltro
            label="Solo revisados"
            checked={filtros.soloRevisados}
            onChange={(v) => actualizarFiltro("soloRevisados", v)}
          />
          <CheckboxFiltro
            label="Solo pendientes"
            checked={filtros.soloPendientes}
            onChange={(v) => actualizarFiltro("soloPendientes", v)}
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <button
            disabled
            title="Disponible en Sprint 4"
            className="bg-[#1a1f25] border border-gray-700 text-gray-500 px-5 py-3 rounded-xl font-semibold cursor-not-allowed"
          >
            Exportar Excel
          </button>
          <button
            disabled
            title="Disponible en Sprint 4"
            className="bg-[#1a1f25] border border-gray-700 text-gray-500 px-5 py-3 rounded-xl font-semibold cursor-not-allowed"
          >
            Exportar PDF
          </button>
          <button
            onClick={handleAplicarAjustes}
            className="bg-green-700 hover:bg-green-600 transition-colors px-5 py-3 rounded-xl font-semibold"
          >
            Aplicar Ajustes
          </button>
        </div>
      </div>

      {/* ESTADOS DE CARGA / ERROR */}
      {cargando && (
        <div className="text-center py-16 text-gray-400">
          Cargando productos...
        </div>
      )}

      {!cargando && error && (
        <div className="text-center py-16 text-red-400 border border-red-900 rounded-xl bg-red-950/20">
          {error}
        </div>
      )}

      {/* TABLA */}
      {!cargando && !error && (
        <div className="overflow-auto rounded-xl border border-green-900">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1f25]">
              <tr>
                <th className="text-left p-4">Producto</th>
                <th className="p-4">Unidad</th>
                <th className="p-4">Stock Sistema</th>
                <th className="p-4">Conteo Físico</th>
                <th className="p-4">Diferencia</th>
                <th className="p-4">Movimiento</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Revisado</th>
              </tr>
            </thead>

            <tbody>
              {filasFiltradas.map((fila) => (
                <tr
                  key={fila.id}
                  className="border-t border-gray-800 hover:bg-[#161b20]"
                >
                  <td className="p-4 font-medium">
                    {fila.nombre}
                    {fila.manejaLotes && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-green-500 border border-green-800 rounded px-1.5 py-0.5">
                        FIFO
                      </span>
                    )}
                  </td>

                  <td className="text-center p-4">{fila.unidad}</td>

                  <td
                    className={`text-center p-4 ${
                      fila.esNegativo ? "text-red-400 font-semibold" : ""
                    }`}
                  >
                    {fila.stock.toFixed(2)}
                  </td>

                  <td className="text-center p-4">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      placeholder={fila.esNegativo ? "Capturar conteo" : "0"}
                      value={fila.conteoValor}
                      onChange={(e) =>
                        actualizarConteo(fila.id, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "-") e.preventDefault();
                      }}
                      className="w-28 text-center bg-[#0f1217] border border-green-800 rounded-lg py-2 outline-none focus:border-green-500"
                    />
                  </td>

                  <td className="text-center p-4 font-bold">
                    {fila.diferencia === null ? (
                      <span className="text-gray-600">—</span>
                    ) : (
                      <span
                        className={
                          fila.diferencia === 0
                            ? "text-green-400"
                            : fila.diferencia > 0
                            ? "text-blue-400"
                            : "text-orange-400"
                        }
                      >
                        {fila.diferencia > 0 ? "+" : ""}
                        {fila.diferencia.toFixed(2)}
                      </span>
                    )}
                  </td>

                  <td
                    className={`text-center p-4 font-medium ${colorMovimiento(
                      fila.movimiento
                    )}`}
                  >
                    {fila.movimiento}
                  </td>

                  <td className="text-center p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${colorEstado(
                        fila.estado
                      )}`}
                    >
                      {fila.estado}
                    </span>
                  </td>

                  <td className="text-center p-4">
                    <input
                      type="checkbox"
                      checked={fila.revisado}
                      onChange={(e) =>
                        actualizarRevisado(fila.id, e.target.checked)
                      }
                      className="w-4 h-4 accent-green-600"
                    />
                  </td>
                </tr>
              ))}

              {filasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-10 text-gray-500">
                    No hay productos que coincidan con los filtros
                    seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL RESUMEN / CONFIRMACIÓN */}
      {mostrarResumen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#151a20] border border-green-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-green-400 mb-1">
              ¿Desea aplicar los ajustes?
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Esta acción creará Entradas/Salidas reutilizando el motor
              existente. No modifica el stock ni los lotes directamente.
            </p>

            <div className="space-y-2 text-gray-300 mb-6">
              <p>
                Entradas:{" "}
                <span className="text-blue-400 font-semibold">
                  {resumenAjustes.entradas}
                </span>
              </p>
              <p>
                Salidas:{" "}
                <span className="text-orange-400 font-semibold">
                  {resumenAjustes.salidas}
                </span>
              </p>
              <p>
                Productos sin cambios:{" "}
                <span className="text-gray-400 font-semibold">
                  {resumenAjustes.sinCambios}
                </span>
              </p>
            </div>

            {errorAjuste && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-950/30 text-red-300 px-3 py-2 text-sm">
                {errorAjuste}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                disabled={aplicando}
                onClick={() => setMostrarResumen(false)}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={aplicando}
                onClick={() => void confirmarAplicarAjustes()}
                className="px-4 py-2 rounded-xl bg-green-700 hover:bg-green-600 font-semibold disabled:opacity-60"
              >
                {aplicando ? "Aplicando..." : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================================================
   SUBCOMPONENTES
================================================== */

interface KpiCardProps {
  titulo: string;
  valor: number | string;
  color?: string;
  subtitulo?: string;
}

function KpiCard({ titulo, valor, color, subtitulo }: KpiCardProps) {
  return (
    <div className="bg-[#151a20] border border-gray-800 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {titulo}
      </p>
      <p className={`text-2xl font-bold ${color ?? "text-white"}`}>
        {valor}
      </p>
      {subtitulo && (
        <p className="text-[10px] text-gray-600 mt-1">{subtitulo}</p>
      )}
    </div>
  );
}

interface CheckboxFiltroProps {
  label: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
}

function CheckboxFiltro({ label, checked, onChange }: CheckboxFiltroProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-green-600"
      />
      {label}
    </label>
  );
}