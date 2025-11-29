import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generarPdfCompras(compras: any[]) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([900, 1200]);

  const { height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = height - 80;

  page.drawText("Reporte de Compras", {
    x: 50,
    y,
    size: 28,
    font,
    color: rgb(0.9, 0.9, 0.1),
  });

  y -= 40;

  const headers = ["Producto", "Proveedor", "Cantidad", "Costo Total", "Fecha"];
  const x = [50, 230, 380, 500, 650];

  headers.forEach((h, i) =>
    page.drawText(h, { x: x[i], y, size: 14, font, color: rgb(1, 1, 0.6) })
  );

  y -= 20;

  compras.forEach((c) => {
    page.drawText(c.producto?.nombre || "-", { x: 50, y, size: 12, font });
    page.drawText(c.proveedor?.nombre || "-", { x: 230, y, size: 12, font });
    page.drawText(String(c.cantidad), { x: 380, y, size: 12, font });
    page.drawText(`$${(c.costo * c.cantidad).toFixed(2)}`, {
      x: 500,
      y,
      size: 12,
      font,
    });
    page.drawText(new Date(c.fecha).toLocaleDateString(), {
      x: 650,
      y,
      size: 12,
      font,
    });
    y -= 18;
  });

  return pdf.save();
}
