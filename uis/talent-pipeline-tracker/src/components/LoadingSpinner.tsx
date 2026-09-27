"use client";

export default function LoadingSpinner({ message = "Cargando…", fullPage = false }: { message?: string; fullPage?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${fullPage ? "min-h-screen" : "py-16"}`} role="status" aria-live="polite">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <div className="absolute inset-1 h-10 w-10 animate-pulse rounded-full bg-blue-600/10" />
      </div>
      <p className="text-base font-medium text-gray-600">{message}</p>
      <span className="sr-only">Cargando contenido…</span>
    </div>
  );
}
