// ──────────────────────────────────────────────
// OrderTypeBadge — Badge visual para tipo de orden
// Distingue entradas (inbound) de salidas (outbound)
// ──────────────────────────────────────────────

"use client";

import type { OrderType } from "@/types/inventory";

interface OrderTypeBadgeProps {
  type: OrderType;
}

const config: Record<OrderType, { label: string; colorClass: string }> = {
  inbound: {
    label: "Entrada",
    colorClass: "bg-green-100 text-green-800 border-green-200",
  },
  outbound: {
    label: "Salida",
    colorClass: "bg-red-100 text-red-800 border-red-200",
  },
};

export function OrderTypeBadge({ type }: OrderTypeBadgeProps) {
  const { label, colorClass } = config[type];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {type === "inbound" ? "📥 " : "📤 "}
      {label}
    </span>
  );
}