// ──────────────────────────────────────────────
// ErrorMessage — Mensaje de error con Layout
// Versión compartida: recibe `backHref` configurable
// Usa <a> en vez de next/link para ser independiente
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export function ErrorMessage({
  title = "Error",
  message,
  showBack = false,
  backHref = "/",
  backLabel = "← Volver al listado",
  onRetry,
  fullPage = false,
}: ErrorMessageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeño retardo para animación de entrada
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const containerClass = fullPage
    ? "mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center"
    : "mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center";

  return (
    <div
      className={`${containerClass} transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      role="alert"
    >
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-red-800">{title}</h2>
      <p className="mt-2 text-sm text-red-600">{message}</p>
      <div className="mt-4 flex items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Reintentar
          </button>
        )}
        {showBack && (
          <a
            href={backHref}
            className="inline-block text-sm font-medium text-tf-blue hover:underline"
          >
            {backLabel}
          </a>
        )}
      </div>
    </div>
  );
}