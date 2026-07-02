import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {

    const productos = await prisma.producto.findMany({
        include:{
            entradas:true,
            salidas:true,
            inventarioLotes:true
        }
    });

    const resultado = productos.map(p=>{

        const entradas = p.entradas.reduce((a,b)=>a+b.cantidad,0);

        const salidas = p.salidas.reduce((a,b)=>a+b.cantidad,0);

        const stockCalculado = entradas-salidas;

        const stockLotes = p.inventarioLotes.reduce(
            (a,b)=>a+b.cantidadDisponible,
            0
        );

        return{

            producto:p.nombre,

            stockGuardado:p.stock,

            entradas,

            salidas,

            stockCalculado,

            stockLotes,

            diferenciaStock:

                p.stock-stockCalculado,

            diferenciaLotes:

                p.stock-stockLotes

        }

    });

    return NextResponse.json(resultado);

}