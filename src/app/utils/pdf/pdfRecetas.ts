import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generarPdfRecetas(recetas: any[]) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  recetas.forEach((rec) => {
    const page = pdf.addPage([900, 1200]);
    let y = 1120;

    page.drawText(`Receta: ${rec.nombre}`, {
      x: 50,
      y,
      size: 26,
      font,
      color: rgb(0.2, 1, 0.4),
    });

    y -= 40;

    page.drawText("Ingredientes:", {
      x: 50,
      y,
      size: 18,
      font,
      color: rgb(0.5, 1, 0.6),
    });

    y -= 25;

    rec.ingredientes.forEach((ing) => {
      page.drawText(
        `• ${ing.producto?.nombre} — ${ing.cantidad} ${ing.producto?.unidad}`,
        { x: 70, y, size: 14, font }
      );
      y -= 18;
    });
  });

  return pdf.save();
}
