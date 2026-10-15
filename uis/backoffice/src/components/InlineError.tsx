// ──────────────────────────────────────────────
// InlineError — Mensaje de error inline (formularios)
// ──────────────────────────────────────────────

"use client";

interface InlineErrorProps {
  message: string;
}

export function InlineError({ message }: InlineErrorProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex-shrink-0">❌</span>
        <span>{message}</span>
      </div>
    </div>
  );
}