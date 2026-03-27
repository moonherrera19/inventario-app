const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Corrigiendo proveedores...");

  const compras = await prisma.compraAdministrativa.findMany();

  console.log(`📦 Total compras encontradas: ${compras.length}`);

  let actualizados = 0;

  for (const compra of compras) {
    try {
      if (!compra.proveedorNombre) continue;

      const nombre = compra.proveedorNombre.trim().toUpperCase();

      const proveedor = await prisma.proveedor.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      });

      await prisma.compraAdministrativa.update({
        where: { id: compra.id },
        data: {
          proveedorId: proveedor.id,
        },
      });

      actualizados++;
    } catch (error) {
      console.error("❌ Error en compra:", compra.id, error);
    }
  }

  console.log(`✅ Actualizados: ${actualizados}`);
}

main()
  .catch((e) => {
    console.error("🔥 ERROR GENERAL:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });