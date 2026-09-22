// ──────────────────────────────────────────────
// Hook: useLead — Carga individual de lead
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lead, LoadingState } from "@/lib/types";
import { getLeadById } from "@/lib/api";

interface UseLeadReturn {
  lead: Lead | null;
  state: LoadingState;
  error: string | null;
  refetch: () => void;
  setLead: React.Dispatch<React.SetStateAction<Lead | null>>;
}

export function useLead(id: number): UseLeadReturn {
  const [lead, setLead] = useState<Lead | null>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await getLeadById(id);
      if (!data) {
        setError("Lead no encontrado");
        setState("error");
        return;
      }
      setLead(data);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el lead. Por favor, intenta de nuevo.");
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  return { lead, state, error, refetch: fetchLead, setLead };
}