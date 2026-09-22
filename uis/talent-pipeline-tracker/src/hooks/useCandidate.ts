"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllCandidates, getCandidateById } from "@/lib/api";
import type { Candidate, LoadingState } from "@/lib/types";

// ─── Hook: lista de candidatos ─────────────────────────────────────────
export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await getAllCandidates();
      setCandidates(data);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los candidatos. Por favor, intenta de nuevo.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { candidates, state, error, refetch: fetch, setCandidates };
}

// ─── Hook: candidato individual ────────────────────────────────────────
export function useCandidate(id: string) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await getCandidateById(id);
      if (!data) {
        setError("Candidato no encontrado. Verifica el ID e intenta de nuevo.");
        setState("error");
        return;
      }
      setCandidate(data);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el candidato. Por favor, intenta de nuevo.");
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { candidate, state, error, refetch: fetch, setCandidate };
}
