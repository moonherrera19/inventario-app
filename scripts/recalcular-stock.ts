import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const aplicar = process.argv.includes("--apply");

  if (aplicar) {
    console.log("");
    console.log("*********** MODO APLICAR ***********");
    console.log("Se actualizará el stock de la base de datos.");
    console.log("");
  }

  const productos = await prisma.producto.findMany({
    orderBy: {
      id: "asc",
    },
  });

  console.log("");
  console.log("======================================");
  console.log("RECONCILIACIÓN DE INVENTARIO");
  console.log("======================================");
  console.log("");

  let modificados = 0;

  for (const producto of productos) {
    const entradas = await prisma.entrada.aggregate({
      where: {
        productoId: producto.id,
      },
      _sum: {
        cantidad: true,
      },
    });

    const salidas = await prisma.salida.aggregate({
      where: {
        productoId: producto.id,
      },
      _sum: {
        cantidad: true,
      },
    });

    const totalEntradas = Number(entradas._sum.cantidad ?? 0);
    const totalSalidas = Number(salidas._sum.cantidad ?? 0);

    const stockCalculado = totalEntradas - totalSalidas;
    const stockGuardado = Number(producto.stock);
    const diferencia = stockGuardado - stockCalculado;

    if (Math.abs(diferencia) > 0.0001) {
      modificados++;

      console.log("");
      console.log("======================================");
      console.log(producto.nombre);
      console.log("--------------------------------------");

      console.table([
        {
          ID: producto.id,
          Producto: producto.nombre,
          Guardado: stockGuardado,
          Calculado: stockCalculado,
          Diferencia: diferencia,
        },
      ]);

      if (aplicar) {
        try {
          await prisma.producto.update({
            where: {
              id: producto.id,
            },
            data: {
              stock: stockCalculado,
            },
          });

          console.log(
            `✅ ${producto.nombre}: ${stockGuardado} → ${stockCalculado}`
          );
        } catch (error) {
          console.error(
            `❌ Error actualizando ${producto.nombre}`,
            error
          );
        }
      }
    }
  }

  console.log("");
  console.log("======================================");
  console.log(`Productos diferentes: ${modificados}`);
  console.log("======================================");

  if (!aplicar) {
    console.log("");
    console.log("Modo reporte.");
    console.log("Nada fue modificado.");
    console.log("");
    console.log("Para aplicar ejecuta:");
    console.log("");
    console.log("npx tsx scripts/recalcular-stock.ts --apply");
  } else {
    console.log("");
    console.log("✅ Reconciliación finalizada.");
  }
}

main()
  .catch((error) => {
    console.error("❌ Error general:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });