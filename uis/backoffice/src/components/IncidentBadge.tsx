// ──────────────────────────────────────────────
// IncidentBadge — Badges de estado / origen
// Gestor de Incidencias Centralizado — TrackFlow
// ──────────────────────────────────────────────

"use client";

import {
  humanize,
  incidentStatusColor,
  incidentOriginColor,
  VALID_TRANSITIONS,
  FINAL_STATUSES,
} from "@/lib/types";
import type { IncidentStatus, IncidentOrigin } from "@/lib/types";

/* ─── Badge de estado ─── */

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${incidentStatusColor(status)}`}
    >
      {humanize(status)}
    </span>
  );
}

/* ─── Badge de origen ─── */

export function IncidentOriginBadge({ origin }: { origin: IncidentOrigin }) {
  const icons: Record<IncidentOrigin, string> = {
    customer: "👤",
    branch: "🏢",
    internal: "⚙️",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${incidentOriginColor(origin)}`}
    >
      {icons[origin]} {humanize(origin)}
    </span>
  );
}

/* ─── Select de cambio de estado (inline) ─── */

interface StatusSelectProps {
  currentStatus: IncidentStatus;
  onChange: (newStatus: IncidentStatus) => void;
  disabled?: boolean;
}

export function IncidentStatusSelect({
  currentStatus,
  onChange,
  disabled = false,
}: StatusSelectProps) {
  const allowedNext = VALID_TRANSITIONS[currentStatus];
  const isFinal = FINAL_STATUSES.includes(currentStatus);

  if (isFinal || allowedNext.length === 0) {
    return (
      <span className="text-xs text-gray-400 italic">
        {isFinal ? "Estado final" : "Sin transiciones"}
      </span>
    );
  }

  return (
    <select
      value=""
      onChange={(e) => {
        const val = e.target.value as IncidentStatus;
        if (val) onChange(val);
      }}
      disabled={disabled}
      className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:border-tf-blue focus:outline-none focus:ring-1 focus:ring-tf-blue disabled:opacity-50"
    >
      <option value="" disabled>
        Cambiar estado…
      </option>
      {allowedNext.map((s) => (
        <option key={s} value={s}>
          → {humanize(s)}
        </option>
      ))}
    </select>
  );
}
