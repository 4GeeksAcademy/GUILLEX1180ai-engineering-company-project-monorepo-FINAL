"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ErrorMessageProps {
  title?: string;
  message: string;
  showBack?: boolean;
  backHref?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export default function ErrorMessage({
  title = "⚠️ Error",
  message,
  showBack = false,
  backHref = "/",
  onRetry,
  fullPage = false,
}: ErrorMessageProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const containerClass = fullPage ? "py-20" : "py-12";

  return (
    <div
      className={`text-center ${containerClass} transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      role="alert"
    >
      <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
        {/* SVG icon */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-red-800 mb-2">{title}</h2>
        <p className="text-red-600 mb-4">{message}</p>
        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Reintentar
            </button>
          )}
          {showBack && (
            <Link
              href={backHref}
              className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Volver al listado
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
