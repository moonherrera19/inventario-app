import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    await prisma.compraAdministrativa.deleteMany({});

    return Response.json({
      ok: true,
      message: "Compras eliminadas correctamente",
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error.message,
    });
  }
}