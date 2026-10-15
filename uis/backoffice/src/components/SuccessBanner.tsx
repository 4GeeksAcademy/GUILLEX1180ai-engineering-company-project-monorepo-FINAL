// ──────────────────────────────────────────────
// SuccessBanner — Banner/toast de confirmación
// ──────────────────────────────────────────────

"use client";

interface SuccessBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function SuccessBanner({ message, onDismiss }: SuccessBannerProps) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>✅</span>
          <span className="font-medium">{message}</span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-green-500 hover:text-green-700 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}