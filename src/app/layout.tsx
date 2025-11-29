import "./globals.css";

export const metadata = {
  title: "Inventario",
  description: "Sistema de inventario profesional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#0f1217] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
