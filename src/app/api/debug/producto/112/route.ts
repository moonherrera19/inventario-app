import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {

    const producto = await prisma.producto.findUnique({
        where:{
            id:122
        }
    });

    const entradas = await prisma.entrada.findMany({
        where:{
            productoId:122
        },
        orderBy:{
            fecha:"asc"
        }
    });

    const salidas = await prisma.salida.findMany({
        where:{
            productoId:122
        },
        orderBy:{
            fecha:"asc"
        }
    });

    const lotes = await prisma.inventarioLote.findMany({
        where:{
            productoId:122
        }
    });

    return NextResponse.json({
        producto,
        entradas,
        salidas,
        lotes
    });

}