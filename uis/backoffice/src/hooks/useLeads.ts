// ──────────────────────────────────────────────
// Hook: useLeads — Carga de lista de leads
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lead, LoadingState } from "@/lib/types";
import { getAllLeads } from "@/lib/api";

interface UseLeadsReturn {
  leads: Lead[];
  state: LoadingState;
  error: string | null;
  refetch: () => void;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await getAllLeads();
      setLeads(data);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los leads. Por favor, intenta de nuevo.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, state, error, refetch: fetchLeads, setLeads };
}