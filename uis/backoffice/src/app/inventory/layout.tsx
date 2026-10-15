// ──────────────────────────────────────────────
// Layout de Inventario — Protección con Auth Guard
// Ruta: /inventory/* (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isChecking, isAuthenticated } = useAuthGuard();
  const pathname = usePathname();

  if (isChecking) {
    return <LoadingSpinner message="Verificando autenticación…" fullPage />;
  }

  if (!isAuthenticated) {
    return null; // redirigido a /login por useAuthGuard
  }

  // Rutas del submódulo de inventario
  const tabs = [
    { href: "/inventory/products", label: "Productos" },
    { href: "/inventory/orders", label: "Historial de Órdenes" },
    { href: "/inventory/orders/inbound", label: "Registrar Entrada" },
    { href: "/inventory/orders/outbound", label: "Registrar Salida" },
  ];

  return (
    <div>
      {/* Navegación secundaria */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-tf-blue text-tf-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      {children}
    </div>
  );
}