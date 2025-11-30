import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { correo, password } = await req.json();

    // Buscar usuario por correo
    const user = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (!user) {
      return Response.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Validar contraseña
    const valido = await bcrypt.compare(password, user.password);
    if (!valido) {
      return Response.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // Login correcto
    return Response.json({
      ok: true,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rolId: user.rolId,
      },
    });

  } catch (error) {
    console.error("❌ Error en el login:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
