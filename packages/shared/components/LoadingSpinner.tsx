// ──────────────────────────────────────────────
// LoadingSpinner — Indicador de carga compartido
// ──────────────────────────────────────────────

"use client";

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ message = "Cargando…", fullPage = false }: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullPage ? "min-h-screen" : "min-h-[300px]"
      } py-10`}
      role="status"
      aria-live="polite"
    >
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-tf-blue" />
        <div className="absolute inset-1 h-10 w-10 animate-pulse rounded-full bg-tf-blue/10" />
      </div>
      <p className="mt-5 text-base font-medium text-gray-600">{message}</p>
      <span className="sr-only">Cargando contenido…</span>
    </div>
  );
}