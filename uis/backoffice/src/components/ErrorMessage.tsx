// ──────────────────────────────────────────────
// ErrorMessage — Mensaje de error con Layout
// ──────────────────────────────────────────────

"use client";

import Link from "next/link";

interface ErrorMessageProps {
  title?: string;
  message: string;
  showBack?: boolean;
}

export function ErrorMessage({
  title = "Error",
  message,
  showBack = false,
}: ErrorMessageProps) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <span className="text-xl font-bold text-red-600">!</span>
      </div>
      <h2 className="text-lg font-semibold text-red-800">{title}</h2>
      <p className="mt-2 text-sm text-red-600">{message}</p>
      {showBack && (
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-tf-blue hover:underline"
        >
          ← Volver al listado
        </Link>
      )}
    </div>
  );
}