import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const nombreProducto = process.argv.slice(2).join(" ");

  if (!nombreProducto) {
    console.log("");
    console.log("Uso:");
    console.log('npx tsx scripts/auditoria.ts "ULTRASOL MICRO REXENE FE"');
    console.log("");
    return;
  }

  const producto = await prisma.producto.findFirst({
    where: {
      nombre: {
        equals: nombreProducto,
        mode: "insensitive",
      },
    },
  });

  if (!producto) {
    console.log("Producto no encontrado.");
    return;
  }

  const entradas = await prisma.entrada.findMany({
    where: {
      productoId: producto.id,
    },
    orderBy: {
      fecha: "asc",
    },
  });

  const salidas = await prisma.salida.findMany({
    where: {
      productoId: producto.id,
    },
    orderBy: {
      fecha: "asc",
    },
  });

  console.log("");
  console.log("===============================================");
  console.log(producto.nombre);
  console.log("===============================================");
  console.log("");

  console.log("ID:", producto.id);
  console.log("Unidad:", producto.unidad);
  console.log("Stock guardado:", producto.stock);

  console.log("");
  console.log("============== ENTRADAS =======================");
  console.log("");

  let totalEntradas = 0;

  for (const e of entradas) {
    totalEntradas += Number(e.cantidad);

    console.log(
      `${e.fecha.toLocaleDateString()}   +${e.cantidad}`
    );
  }

  console.log("");
  console.log("TOTAL ENTRADAS:", totalEntradas);

  console.log("");
  console.log("============== SALIDAS ========================");
  console.log("");

  let totalSalidas = 0;

  for (const s of salidas) {
    totalSalidas += Number(s.cantidad);

    console.log(
      `${s.fecha.toLocaleDateString()}   -${s.cantidad}   ${s.rancho ?? ""} ${s.cultivo ?? ""}`
    );
  }

  console.log("");
  console.log("TOTAL SALIDAS:", totalSalidas);

  const calculado = totalEntradas - totalSalidas;

  console.log("");
  console.log("===============================================");
  console.log("RESUMEN");
  console.log("===============================================");
  console.log("");

  console.log("Entradas :", totalEntradas);
  console.log("Salidas  :", totalSalidas);
  console.log("Calculado:", calculado);
  console.log("Guardado :", producto.stock);
  console.log("Diferencia:", producto.stock - calculado);

  if (producto.manejaLotes) {
    console.log("");
    console.log("============== LOTES ==========================");
    console.log("");

    const lotes = await prisma.inventarioLote.findMany({
      where: {
        productoId: producto.id,
      },
      orderBy: {
        fechaEntrada: "asc",
      },
    });

    let sumaLotes = 0;

    for (const lote of lotes) {
      sumaLotes += lote.cantidadDisponible;

      console.log(
        `${lote.loteCodigo} | Disponible: ${lote.cantidadDisponible} | Caduca: ${
          lote.fechaCaducidad
            ? lote.fechaCaducidad.toLocaleDateString()
            : "-"
        }`
      );
    }

    console.log("");
    console.log("TOTAL EN LOTES:", sumaLotes);
  }

  console.log("");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });