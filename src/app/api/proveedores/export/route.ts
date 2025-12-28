import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const headers = [
      "NOMBRE",
      "TELEFONO",
      "CORREO",
      "DIRECCION",
      "RFC",
      "BANCO_MXN",
      "CUENTA_MXN",
      "CLABE_MXN",
      "BANCO_USD",
      "CUENTA_USD",
      "CLABE_USD",
    ];

    // Fila de ejemplo
    const exampleRow = {
      NOMBRE: "PROVEEDOR EJEMPLO",
      TELEFONO: "5551234567",
      CORREO: "correo@ejemplo.com",
      DIRECCION: "Dirección del proveedor",
      RFC: "RFC123456",
      BANCO_MXN: "BBVA",
      CUENTA_MXN: "1234567890",
      CLABE_MXN: "012345678901234567",
      BANCO_USD: "BANK OF AMERICA",
      CUENTA_USD: "987654321",
      CLABE_USD: "111222333444555666",
    };

    const worksheet = XLSX.utils.json_to_sheet([exampleRow], {
      header: headers,
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "PLANTILLA_PROVEEDORES"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition":
          "attachment; filename=plantilla_proveedores.xlsx",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("❌ Error exportando Excel:", error);
    return NextResponse.json(
      { message: "Error al generar Excel" },
      { status: 500 }
    );
  }
}
