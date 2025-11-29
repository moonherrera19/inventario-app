import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generarPdfMovimientos(movs: any[], tipo: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([900, 1200]);

  const { height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = height - 80;

  // Título
  page.drawText(`Reporte de ${tipo}`, {
    x: 50,
    y,
    size: 28,
    font,
    color: rgb(0.2, 0.9, 0.3),
  });

  y -= 40;

  const headers = ["Producto", "Cantidad", "Fecha"];
  const xPos = [50, 300, 450];

  headers.forEach((h, i) => {
    page.drawText(h, {
      x: xPos[i],
      y,
      size: 14,
      color: rgb(0.7, 1, 0.7),
      font,
    });
  });

  y -= 20;

  movs.forEach((m) => {
    page.drawText(m.producto?.nombre || "-", { x: 50, y, size: 12, font });
    page.drawText(String(m.cantidad), { x: 300, y, size: 12, font });
    page.drawText(new Date(m.fecha).toLocaleDateString(), {
      x: 450,
      y,
      size: 12,
      font,
    });
    y -= 18;
  });

  return pdf.save();
}
