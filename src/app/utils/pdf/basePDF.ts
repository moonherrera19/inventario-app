// lib/pdf/basePDF.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function crearPDFBase() {
  const pdfDoc = await PDFDocument.create();

  // Página inicial
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
  const { width, height } = page.getSize();

  // Tipografía
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Encabezado estilo agrícola
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width,
    height: 60,
    color: rgb(0.02, 0.25, 0.12), // verde oscuro
  });

  // LOGO (opcional)
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);

    page.drawImage(logoImage, {
      x: 20,
      y: height - 55,
      width: 45,
      height: 45,
    });
  } catch (e) {
    console.log("Sin logo, continuamos…");
  }

  // Título
  page.drawText("SISTEMA DE INVENTARIO AGRÍCOLA", {
    x: 75,
    y: height - 40,
    size: 18,
    font,
    color: rgb(1, 1, 1),
  });

  // Footer
  page.drawText("Reporte generado automáticamente • Inventario Agrícola PRO", {
    x: 20,
    y: 20,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  return { pdfDoc, page, width, height, font };
}
