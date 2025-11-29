/*
  Warnings:

  - Added the required column `actualizadoEn` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Categoria" ADD COLUMN     "descripcion" TEXT;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "precioUnitario" DOUBLE PRECISION,
ADD COLUMN     "proveedorId" INTEGER,
ADD COLUMN     "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
