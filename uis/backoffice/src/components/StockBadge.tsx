// ──────────────────────────────────────────────
// StockBadge — Indicador visual de nivel de stock
// Alineado con STOCK_THRESHOLD_LOW / STOCK_THRESHOLD_MEDIUM
// ──────────────────────────────────────────────

"use client";

import {
  STOCK_THRESHOLD_LOW,
  STOCK_THRESHOLD_MEDIUM,
} from "@/types/inventory";

interface StockBadgeProps {
  currentStock: number;
}

/**
 * Indicador visual del nivel de stock.
 *
 * Criterio documentado:
 *  - Stock BAJO (rojo):    <= STOCK_THRESHOLD_LOW (10)
 *  - Stock MEDIO (amarillo): > LOW y <= MEDIUM (11-50)
 *  - Stock SALUDABLE (verde): > STOCK_THRESHOLD_MEDIUM (50+)
 *
 * Para productos de e-commerce con rotación mensual media-alta.
 */
export function StockBadge({ currentStock }: StockBadgeProps) {
  let colorClass: string;
  let label: string;

  if (currentStock <= STOCK_THRESHOLD_LOW) {
    colorClass = "bg-red-100 text-red-800 border-red-200";
    label = "Stock Bajo";
  } else if (currentStock <= STOCK_THRESHOLD_MEDIUM) {
    colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
    label = "Stock Medio";
  } else {
    colorClass = "bg-green-100 text-green-800 border-green-200";
    label = "Stock Saludable";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
      title={`${currentStock} unidades — ${label}`}
    >
      {/* Bola de indicación */}
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          currentStock <= STOCK_THRESHOLD_LOW
            ? "bg-red-500"
            : currentStock <= STOCK_THRESHOLD_MEDIUM
              ? "bg-yellow-500"
              : "bg-green-500"
        }`}
      />
      {currentStock} — {label}
    </span>
  );
}