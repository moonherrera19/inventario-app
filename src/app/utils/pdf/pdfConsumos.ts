import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generarPdfConsumos(consumos: any[]) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([900, 1200]);

  const { height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let y = height - 80;

  page.drawText("Consumos por Lote", {
    x: 50,
    y,
    size: 28,
    font,
    color: rgb(0.3, 0.7, 1),
  });
  y -= 40;

  const headers = ["Lote", "Producto", "Cantidad", "Fecha"];
  const pos = [50, 220, 430, 540];

  headers.forEach((h, i) =>
    page.drawText(h, {
      x: pos[i],
      y,
      size: 14,
      font,
      color: rgb(0.6, 0.9, 1),
    })
  );

  y -= 20;

  consumos.forEach((c) => {
    page.drawText(c.lote?.nombre || "-", { x: 50, y, size: 12, font });
    page.drawText(c.producto?.nombre || "-", { x: 220, y, size: 12, font });
    page.drawText(String(c.cantidad), { x: 430, y, size: 12, font });
    page.drawText(new Date(c.fecha).toLocaleDateString(), {
      x: 540,
      y,
      size: 12,
      font,
    });
    y -= 18;
  });

  return pdf.save();
}
