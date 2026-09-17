// ──────────────────────────────────────────────
// StatusBadge — Badge de estado o etapa
// ──────────────────────────────────────────────

"use client";

import { humanize, statusColor, stageColor } from "@/lib/types";

interface StatusBadgeProps {
  value: string;
  type?: "status" | "stage";
}

export function StatusBadge({ value, type = "status" }: StatusBadgeProps) {
  const colorClass =
    type === "status" ? statusColor(value as any) : stageColor(value as any);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {humanize(value)}
    </span>
  );
}