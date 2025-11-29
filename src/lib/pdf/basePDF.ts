import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function crearPDFBase() {
  // Crear documento
  const pdfDoc = await PDFDocument.create();

  // Crear página tamaño carta
  const page = pdfDoc.addPage([595.28, 841.89]);

  // Cargar fuente estándar
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const width = page.getWidth();
  const height = page.getHeight();

  // Encabezado
  page.drawText("SISTEMA DE INVENTARIO AGRÍCOLA", {
    x: 20,
    y: height - 40,
    size: 16,
    font,
    color: rgb(0, 0.5, 0.2),
  });

  // Línea separadora
  page.drawLine({
    start: { x: 20, y: height - 50 },
    end: { x: width - 20, y: height - 50 },
    thickness: 2,
    color: rgb(0, 0.4, 0.15),
  });

  return { pdfDoc, page, width, height, font };
}
