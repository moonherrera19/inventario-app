import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generarPdfInventario(productos: any[]) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([900, 1200]);

  const { height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = height - 80;

  // Título
  page.drawText("Inventario General", {
    x: 50,
    y,
    size: 28,
    font,
    color: rgb(0.1, 0.8, 0.3),
  });
  y -= 40;

  // Encabezados
  const headers = ["Producto", "Categoría", "Stock", "Unidad", "Proveedor"];
  const xPositions = [50, 260, 430, 520, 600];

  headers.forEach((h, i) => {
    page.drawText(h, {
      x: xPositions[i],
      y,
      size: 14,
      font,
      color: rgb(0.7, 1, 0.7),
    });
  });

  y -= 20;

  // Datos
  productos.forEach((p) => {
    page.drawText(p.nombre, { x: 50, y, size: 12, font });
    page.drawText(p.categoria?.nombre || "-", { x: 260, y, size: 12, font });
    page.drawText(String(p.stock), { x: 430, y, size: 12, font });
    page.drawText(p.unidad, { x: 520, y, size: 12, font });
    page.drawText(p.proveedor?.nombre || "-", { x: 600, y, size: 12, font });
    y -= 18;
  });

  return await pdf.save();
}
