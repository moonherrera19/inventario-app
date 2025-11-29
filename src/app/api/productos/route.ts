import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================================
// GET - Obtener todos los productos
// ======================================================
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { id: "desc" },
      include: {
        categoria: true,
        proveedor: true,
        entradas: true,
        salidas: true,
        compras: true,
      },
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error("❌ Error GET productos:", error);
    return NextResponse.json(
      { message: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

// ======================================================
// POST - Crear nuevo producto
// ======================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let {
      nombre,
      unidad,
      categoriaId,
      proveedorId,
      precioUnitario,
      stockMinimo,
    } = body;

    // Sanitizar
    nombre = nombre?.trim();
    unidad = unidad?.trim();

    // Validaciones
    if (!nombre || !unidad) {
      return NextResponse.json(
        { message: "Nombre y unidad son obligatorios." },
        { status: 400 }
      );
    }

    if (precioUnitario != null && Number(precioUnitario) < 0) {
      return NextResponse.json(
        { message: "El precio unitario no puede ser negativo." },
        { status: 400 }
      );
    }

    if (stockMinimo != null && Number(stockMinimo) < 0) {
      return NextResponse.json(
        { message: "El stock mínimo debe ser mayor o igual a 0." },
        { status: 400 }
      );
    }

    // Validar que nombre no esté duplicado
    const existe = await prisma.producto.findFirst({
      where: { nombre },
    });

    if (existe) {
      return NextResponse.json(
        { message: "Ya existe un producto con este nombre." },
        { status: 400 }
      );
    }

    const nuevo = await prisma.producto.create({
      data: {
        nombre,
        unidad,
        categoriaId: categoriaId || null,
        proveedorId: proveedorId || null,
        precioUnitario: precioUnitario ? Number(precioUnitario) : null,
        stockMinimo: stockMinimo ? Number(stockMinimo) : 0,
      },
    });

    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error("❌ Error POST productos:", error);
    return NextResponse.json(
      { message: "Error al crear producto" },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT - Actualizar producto
// ======================================================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    let {
      id,
      nombre,
      unidad,
      categoriaId,
      proveedorId,
      precioUnitario,
      stockMinimo,
    } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID del producto requerido." },
        { status: 400 }
      );
    }

    // Sanitizar
    nombre = nombre?.trim();
    unidad = unidad?.trim();

    // Validaciones
    if (!nombre || !unidad) {
      return NextResponse.json(
        { message: "Nombre y unidad son obligatorios." },
        { status: 400 }
      );
    }

    if (precioUnitario != null && Number(precioUnitario) < 0) {
      return NextResponse.json(
        { message: "El precio unitario no puede ser negativo." },
        { status: 400 }
      );
    }

    if (stockMinimo != null && Number(stockMinimo) < 0) {
      return NextResponse.json(
        { message: "El stock mínimo debe ser mayor o igual a 0." },
        { status: 400 }
      );
    }

    // Evitar duplicados (si se cambia el nombre)
    const existe = await prisma.producto.findFirst({
      where: {
        nombre,
        NOT: { id },
      },
    });

    if (existe) {
      return NextResponse.json(
        { message: "Ya existe un producto con este nombre." },
        { status: 400 }
      );
    }

    const actualizado = await prisma.producto.update({
      where: { id },
      data: {
        nombre,
        unidad,
        categoriaId: categoriaId || null,
        proveedorId: proveedorId || null,
        precioUnitario: precioUnitario ? Number(precioUnitario) : null,
        stockMinimo: stockMinimo ? Number(stockMinimo) : 0,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("❌ Error PUT productos:", error);
    return NextResponse.json(
      { message: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE - Eliminar producto
// ======================================================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { message: "ID inválido." },
        { status: 400 }
      );
    }

    // Verificar si el producto tiene movimientos
    const tieneMovimientos = await prisma.entrada.findFirst({ where: { productoId: id } }) ||
                             await prisma.salida.findFirst({ where: { productoId: id } }) ||
                             await prisma.compra.findFirst({ where: { productoId: id } });

    if (tieneMovimientos) {
      return NextResponse.json(
        { message: "No se puede eliminar un producto con movimientos registrados." },
        { status: 400 }
      );
    }

    await prisma.producto.delete({ where: { id } });

    return NextResponse.json({ message: "Producto eliminado correctamente." });
  } catch (error) {
    console.error("❌ Error DELETE productos:", error);
    return NextResponse.json(
      { message: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}
