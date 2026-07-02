export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { Buffer } from "buffer";

// ===========================================
// CONFIGURACIÓN / CONSTANTES
// ===========================================
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 40;
const MARGIN_BOTTOM = 70; // deja espacio para el footer
const ROW_HEIGHT = 18;
const MAX_NAME_LENGTH = 32;

const COLORS = {
  primary: rgb(0, 0.4, 0.2),
  primaryText: rgb(0, 0.5, 0.25),
  text: rgb(0.15, 0.15, 0.15),
  muted: rgb(0.45, 0.45, 0.45),
  headerBg: rgb(0.93, 0.96, 0.93),
  rowAlt: rgb(0.97, 0.98, 0.97),
  danger: rgb(0.75, 0.1, 0.1),
  dangerBg: rgb(0.99, 0.92, 0.92),
  warning: rgb(0.8, 0.5, 0),
  border: rgb(0.8, 0.8, 0.8),
};

const COLUMNS = {
  producto: { x: 40, width: 220 },
  unidad: { x: 260, width: 80 },
  stock: { x: 350, width: 70 },
  minimo: { x: 430, width: 70 },
  estado: { x: 500, width: 55 },
};

type ProductoRow = {
  nombre: string;
  unidad: string | null;
  stock: number;
  stockMinimo: number | null;
};

type PageContext = {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
  pageNumber: number;
};

// ===========================================
// HELPERS
// ===========================================
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

function formatFecha(date: Date): string {
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getStockEstado(stock: number, minimo: number): {
  label: string;
  color: ReturnType<typeof rgb>;
  bg: ReturnType<typeof rgb> | null;
} {
  if (stock <= 0) return { label: "AGOTADO", color: COLORS.danger, bg: COLORS.dangerBg };
  if (stock <= minimo) return { label: "BAJO", color: COLORS.danger, bg: COLORS.dangerBg };
  if (stock <= minimo * 1.5) return { label: "ALERTA", color: COLORS.warning, bg: null };
  return { label: "OK", color: COLORS.primaryText, bg: null };
}

// ===========================================
// ENCABEZADO DE PÁGINA (se repite en cada página)
// ===========================================
function drawPageHeader(ctx: PageContext, isFirstPage: boolean): number {
  const { page, font, bold } = ctx;
  let y = PAGE_HEIGHT - 40;

  page.drawText("AGRÍCOLA LA HACHERA", {
    x: MARGIN_X,
    y,
    size: 18,
    font: bold,
    color: COLORS.primaryText,
  });

  page.drawText(`Página ${ctx.pageNumber}`, {
    x: PAGE_WIDTH - MARGIN_X - 70,
    y: y + 4,
    size: 10,
    font,
    color: COLORS.muted,
  });

  y -= 8;
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_WIDTH - MARGIN_X, y },
    thickness: 1.5,
    color: COLORS.primary,
  });

  y -= 28;
  page.drawText("REPORTE DE INVENTARIO GENERAL", {
    x: MARGIN_X,
    y,
    size: 15,
    font: bold,
    color: COLORS.text,
  });

  y -= 20;
  page.drawText(`Generado el: ${formatFecha(new Date())}`, {
    x: MARGIN_X,
    y,
    size: 10,
    font,
    color: COLORS.muted,
  });

  y -= 25;
  return y;
}

// ===========================================
// RESUMEN EJECUTIVO (solo primera página)
// ===========================================
function drawResumenEjecutivo(
  ctx: PageContext,
  y: number,
  data: {
    totalProductos: number;
    totalStock: number;
    productosBajoMinimo: number;
    productosAgotados: number;
  }
): number {
  const { page, font, bold } = ctx;
  const boxHeight = 65;
  const boxWidth = PAGE_WIDTH - MARGIN_X * 2;

  page.drawRectangle({
    x: MARGIN_X,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: COLORS.headerBg,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  const colWidth = boxWidth / 4;
  const items = [
    { label: "Total Productos", value: String(data.totalProductos) },
    { label: "Stock Total", value: data.totalStock.toLocaleString("es-MX") },
    { label: "Bajo Mínimo", value: String(data.productosBajoMinimo), warn: data.productosBajoMinimo > 0 },
    { label: "Agotados", value: String(data.productosAgotados), warn: data.productosAgotados > 0 },
  ];

  items.forEach((item, i) => {
    const x = MARGIN_X + colWidth * i + 15;
    page.drawText(item.label, {
      x,
      y: y - 22,
      size: 9,
      font,
      color: COLORS.muted,
    });
    page.drawText(item.value, {
      x,
      y: y - 45,
      size: 16,
      font: bold,
      color: item.warn ? COLORS.danger : COLORS.primaryText,
    });
  });

  return y - boxHeight - 25;
}

// ===========================================
// ENCABEZADOS DE TABLA
// ===========================================
function drawTableHeader(ctx: PageContext, y: number): number {
  const { page, bold } = ctx;

  page.drawRectangle({
    x: MARGIN_X,
    y: y - 6,
    width: PAGE_WIDTH - MARGIN_X * 2,
    height: 20,
    color: COLORS.headerBg,
  });

  page.drawText("Producto", { x: COLUMNS.producto.x + 6, y, size: 10, font: bold, color: COLORS.text });
  page.drawText("Unidad", { x: COLUMNS.unidad.x, y, size: 10, font: bold, color: COLORS.text });
  page.drawText("Stock", { x: COLUMNS.stock.x, y, size: 10, font: bold, color: COLORS.text });
  page.drawText("Mínimo", { x: COLUMNS.minimo.x, y, size: 10, font: bold, color: COLORS.text });
  page.drawText("Estado", { x: COLUMNS.estado.x, y, size: 10, font: bold, color: COLORS.text });

  y -= 12;
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_WIDTH - MARGIN_X, y },
    thickness: 1,
    color: COLORS.primary,
  });

  return y - 18;
}

// ===========================================
// FOOTER (pie de página)
// ===========================================
function drawFooter(page: PDFPage, font: PDFFont, pageNumber: number, totalPages: number) {
  const footerY = 35;

  page.drawLine({
    start: { x: MARGIN_X, y: footerY + 15 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: footerY + 15 },
    thickness: 0.5,
    color: COLORS.border,
  });

  page.drawText("Sistema de Inventario Agrícola · Agrícola La Hachera", {
    x: MARGIN_X,
    y: footerY,
    size: 8,
    font,
    color: COLORS.muted,
  });

  const pageLabel = `Página ${pageNumber} de ${totalPages}`;
  const labelWidth = font.widthOfTextAtSize(pageLabel, 8);
  page.drawText(pageLabel, {
    x: PAGE_WIDTH - MARGIN_X - labelWidth,
    y: footerY,
    size: 8,
    font,
    color: COLORS.muted,
  });
}

// ===========================================
// FILA DE PRODUCTO
// ===========================================
function drawProductRow(ctx: PageContext, y: number, p: ProductoRow, rowIndex: number): void {
  const { page, font, bold } = ctx;
  const minimo = p.stockMinimo ?? 0;
  const estado = getStockEstado(p.stock, minimo);

  // Fondo alterno de fila
  if (rowIndex % 2 === 0) {
    page.drawRectangle({
      x: MARGIN_X,
      y: y - 4,
      width: PAGE_WIDTH - MARGIN_X * 2,
      height: ROW_HEIGHT,
      color: COLORS.rowAlt,
    });
  }

  // Resaltar fila si stock bajo/agotado
  if (estado.bg) {
    page.drawRectangle({
      x: MARGIN_X,
      y: y - 4,
      width: PAGE_WIDTH - MARGIN_X * 2,
      height: ROW_HEIGHT,
      color: estado.bg,
    });
  }

  page.drawText(truncateText(p.nombre, MAX_NAME_LENGTH), {
    x: COLUMNS.producto.x + 6,
    y,
    size: 9.5,
    font,
    color: COLORS.text,
  });

  page.drawText(p.unidad ?? "-", {
    x: COLUMNS.unidad.x,
    y,
    size: 9.5,
    font,
    color: COLORS.text,
  });

  page.drawText(String(p.stock), {
    x: COLUMNS.stock.x,
    y,
    size: 9.5,
    font: estado.label !== "OK" ? bold : font,
    color: estado.color,
  });

  page.drawText(String(minimo), {
    x: COLUMNS.minimo.x,
    y,
    size: 9.5,
    font,
    color: COLORS.text,
  });

  page.drawText(estado.label, {
    x: COLUMNS.estado.x,
    y,
    size: 8.5,
    font: bold,
    color: estado.color,
  });
}

// ===========================================
// TOTALES (última página)
// ===========================================
function drawTotales(ctx: PageContext, y: number, totalStock: number, count: number): number {
  const { page, bold } = ctx;

  y -= 10;
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_WIDTH - MARGIN_X, y },
    thickness: 1,
    color: COLORS.primary,
  });

  y -= 20;
  page.drawText(`Total de productos: ${count}`, {
    x: MARGIN_X,
    y,
    size: 10,
    font: bold,
    color: COLORS.text,
  });

  page.drawText(`Stock total: ${totalStock.toLocaleString("es-MX")}`, {
    x: COLUMNS.stock.x,
    y,
    size: 10,
    font: bold,
    color: COLORS.primaryText,
  });

  return y - 25;
}

// ===========================================
// HANDLER PRINCIPAL
// ===========================================
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { nombre: "asc" },
      select: { nombre: true, unidad: true, stock: true, stockMinimo: true },
    });

    const totalStock = productos.reduce((sum, p) => sum + p.stock, 0);
    const productosBajoMinimo = productos.filter(
      (p) => p.stock > 0 && p.stock <= (p.stockMinimo ?? 0)
    ).length;
    const productosAgotados = productos.filter((p) => p.stock <= 0).length;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const ctx: PageContext = {
      pdfDoc,
      page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
      y: 0,
      font,
      bold,
      pageNumber: 1,
    };

    // Primera página: header + resumen + tabla
    ctx.y = drawPageHeader(ctx, true);
    ctx.y = drawResumenEjecutivo(ctx, ctx.y, {
      totalProductos: productos.length,
      totalStock,
      productosBajoMinimo,
      productosAgotados,
    });
    ctx.y = drawTableHeader(ctx, ctx.y);

    productos.forEach((p, index) => {
      if (ctx.y < MARGIN_BOTTOM) {
        ctx.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        ctx.pageNumber += 1;
        ctx.y = drawPageHeader(ctx, false);
        ctx.y = drawTableHeader(ctx, ctx.y);
      }

      drawProductRow(ctx, ctx.y, p, index);
      ctx.y -= ROW_HEIGHT;
    });

    ctx.y = drawTotales(ctx, ctx.y, totalStock, productos.length);

    // Footer en todas las páginas (requiere conocer el total al final)
    const totalPages = pdfDoc.getPageCount();
    pdfDoc.getPages().forEach((p, i) => {
      drawFooter(p, font, i + 1, totalPages);
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=inventario_general.pdf",
      },
    });
  } catch (error) {
    console.error("❌ Error PDF INVENTARIO:", error);
    return NextResponse.json({ msg: "Error generando PDF" }, { status: 500 });
  }
}