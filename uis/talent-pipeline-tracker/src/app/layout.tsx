import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talent Pipeline Tracker",
  description: "Seguimiento de candidaturas del pipeline de talento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <a href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  🎯 Talent Pipeline Tracker
                </a>
                <nav className="text-sm text-gray-500">
                  Gestión de candidaturas
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
