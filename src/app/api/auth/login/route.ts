import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { correo, password } = await req.json();

    const user = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (!user) {
      return Response.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const valido = await bcrypt.compare(password, user.password);
    if (!valido) {
      return Response.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // Solo regresamos OK
    return Response.json({ ok: true });

  } catch (error) {
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
