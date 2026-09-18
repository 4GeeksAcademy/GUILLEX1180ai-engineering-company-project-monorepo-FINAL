import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackFlow — Proveedores",
  description:
    "Panel de gestión de proveedores logísticos de TrackFlow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-tf-gray font-sans antialiased">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/suppliers" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tf-blue text-sm font-bold text-white">
                TF
              </div>
              <span className="text-lg font-bold text-tf-dark">
                TrackFlow <span className="text-tf-blue">Proveedores</span>
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/suppliers" className="hover:text-tf-blue transition-colors">
                Directorio
              </Link>
              <Link
                href="/suppliers/new"
                className="rounded-lg bg-tf-blue px-4 py-2 text-white hover:bg-tf-blue-dark transition-colors"
              >
                + Nuevo proveedor
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-400 sm:px-6 lg:px-8">
            © {new Date().getFullYear()} TrackFlow — Panel de Proveedores.
          </div>
        </footer>
      </body>
    </html>
  );
}