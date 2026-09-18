"use client";

import { supplierStatusColor } from "@/lib/types";

export function SupplierBadge({ status }: { status: string }) {
  const colorClass = supplierStatusColor(status);
  const label = status === "activo" ? "Activo" : "Suspendido";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      {status === "activo" ? "● " : "○ "}
      {label}
    </span>
  );
}