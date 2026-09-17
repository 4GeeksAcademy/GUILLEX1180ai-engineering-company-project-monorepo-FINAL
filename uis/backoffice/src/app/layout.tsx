// ──────────────────────────────────────────────
// Layout principal del Backoffice de TrackFlow
// ──────────────────────────────────────────────

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackFlow Tech — Backoffice",
  description:
    "Panel interno de TrackFlow para gestión de leads, candidatos y operaciones comerciales.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-tf-gray font-sans antialiased">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tf-blue text-sm font-bold text-white">
                TF
              </div>
              <span className="text-lg font-bold text-tf-dark">
                TrackFlow <span className="text-tf-blue">Tech</span>
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-tf-blue transition-colors">
                Leads
              </Link>
              <Link
                href="/candidates/new"
                className="rounded-lg bg-tf-blue px-4 py-2 text-white hover:bg-tf-blue-dark transition-colors"
              >
                + Nuevo Lead
              </Link>
            </nav>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-400 sm:px-6 lg:px-8">
            © {new Date().getFullYear()} TrackFlow Tech — Backoffice interno.
            Todos los derechos reservados.
          </div>
        </footer>
      </body>
    </html>
  );
}