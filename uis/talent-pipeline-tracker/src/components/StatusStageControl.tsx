"use client";

import { useState } from "react";
import { patchCandidate } from "@/lib/api";
import {
  STATUS_OPTIONS,
  STAGE_OPTIONS,
  type CandidateStatus,
  type CandidateStage,
} from "@/lib/types";

interface Props {
  candidateId: string;
  initialStatus: CandidateStatus;
  initialStage: CandidateStage;
  /** Callback para actualizar el candidato en el estado del padre */
  onUpdate: (patch: { status?: CandidateStatus; stage?: CandidateStage }) => void;
}

export default function StatusStageControl({
  candidateId,
  initialStatus,
  initialStage,
  onUpdate,
}: Props) {
  const [status, setStatus] = useState<CandidateStatus>(initialStatus);
  const [stage, setStage] = useState<CandidateStage>(initialStage);
  const [saving, setSaving] = useState<"status" | "stage" | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    setSaving("status");
    setMsg(null);
    try {
      await patchCandidate(candidateId, { status: newStatus });
      setStatus(newStatus);
      onUpdate({ status: newStatus });
      setMsg({ type: "ok", text: "Estado actualizado." });
    } catch (err) {
      setStatus(initialStatus); // revertir
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(null);
    }
  };

  const handleStageChange = async (newStage: CandidateStage) => {
    setSaving("stage");
    setMsg(null);
    try {
      await patchCandidate(candidateId, { stage: newStage });
      setStage(newStage);
      onUpdate({ stage: newStage });
      setMsg({ type: "ok", text: "Etapa actualizada." });
    } catch (err) {
      setStage(initialStage); // revertir
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Feedback */}
      {msg && (
        <p
          className={`text-sm font-medium ${
            msg.type === "ok" ? "text-green-700" : "text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={status}
            disabled={saving === "status"}
            onChange={(e) => handleStatusChange(e.target.value as CandidateStatus)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {saving === "status" && (
            <span className="text-xs text-gray-400 mt-1">Guardando…</span>
          )}
        </div>

        {/* Etapa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Etapa
          </label>
          <select
            value={stage}
            disabled={saving === "stage"}
            onChange={(e) => handleStageChange(e.target.value as CandidateStage)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {saving === "stage" && (
            <span className="text-xs text-gray-400 mt-1">Guardando…</span>
          )}
        </div>
      </div>
    </div>
  );
}
