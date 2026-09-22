// ──────────────────────────────────────────────
// ErrorMessage — Mensaje de error con Layout
// ──────────────────────────────────────────────

"use client";

import Link from "next/link";

interface ErrorMessageProps {
  title?: string;
  message: string;
  showBack?: boolean;
  retryAction?: () => void;
}

export function ErrorMessage({
  title = "Error",
  message,
  showBack = false,
  retryAction,
}: ErrorMessageProps) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <span className="text-xl font-bold text-red-600">!</span>
      </div>
      <h2 className="text-lg font-semibold text-red-800">{title}</h2>
      <p className="mt-2 text-sm text-red-600">{message}</p>
      <div className="mt-4 flex flex-col items-center gap-2">
        {retryAction && (
          <button
            onClick={retryAction}
            className="rounded-lg bg-tf-blue px-4 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors"
          >
            Reintentar
          </button>
        )}
        {showBack && (
          <Link
            href="/"
            className="text-sm font-medium text-tf-blue hover:underline"
          >
            ← Volver al listado
          </Link>
        )}
      </div>
    </div>
  );
}