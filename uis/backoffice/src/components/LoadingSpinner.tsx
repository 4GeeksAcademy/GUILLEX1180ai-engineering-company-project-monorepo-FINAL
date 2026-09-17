// ──────────────────────────────────────────────
// LoadingSpinner — Indicador de carga
// ──────────────────────────────────────────────

"use client";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Cargando…" }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-tf-blue border-t-transparent" />
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  );
}