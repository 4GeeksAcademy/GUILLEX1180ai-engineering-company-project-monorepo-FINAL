// ──────────────────────────────────────────────
// useIncidentsList / useIncidentSummary
// Hooks CRUD para el Gestor de Incidencias Centralizado
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Incident,
  IncidentFormData,
  IncidentSummary,
  IncidentStatus,
  LoadingState,
} from "@/lib/types";
import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  deleteIncident,
  getIncidentSummary,
} from "@/lib/api";

/* ─── Hook: Listado con filtros ─── */

interface UseIncidentsListReturn {
  incidents: Incident[];
  state: LoadingState;
  error: string | null;
  filters: {
    status: string;
    origin: string;
    branch: string;
    category: string;
  };
  setStatus: (s: string) => void;
  setOrigin: (o: string) => void;
  setBranch: (b: string) => void;
  setCategory: (c: string) => void;
  refetch: () => Promise<void>;
  changeStatus: (id: string, newStatus: IncidentStatus) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export function useIncidentsList(): UseIncidentsListReturn {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [origin, setOrigin] = useState("");
  const [branch, setBranch] = useState("");
  const [category, setCategory] = useState("");

  const fetchIncidents = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const filters: Record<string, string> = {};
      if (status) filters.status = status;
      if (origin) filters.origin = origin;
      if (branch) filters.branch = branch;
      if (category) filters.category = category;
      const data = await getAllIncidents(filters);
      setIncidents(data);
      setState("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar incidencias"
      );
      setState("error");
    }
  }, [status, origin, branch, category]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  /** Actualiza el estado de una incidencia (PATCH). Recarga la lista después. */
  const changeStatus = useCallback(
    async (id: string, newStatus: IncidentStatus): Promise<boolean> => {
      try {
        await updateIncidentStatus(id, newStatus);
        await fetchIncidents();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al actualizar estado"
        );
        return false;
      }
    },
    [fetchIncidents]
  );

  /** Elimina una incidencia. Recarga la lista después. */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteIncident(id);
        await fetchIncidents();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al eliminar incidencia"
        );
        return false;
      }
    },
    [fetchIncidents]
  );

  return {
    incidents,
    state,
    error,
    filters: { status, origin, branch, category },
    setStatus,
    setOrigin,
    setBranch,
    setCategory,
    refetch: fetchIncidents,
    changeStatus,
    remove,
  };
}

/* ─── Hook: Resumen de métricas ─── */

interface UseIncidentSummaryReturn {
  summary: IncidentSummary | null;
  state: LoadingState;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useIncidentSummary(): UseIncidentSummaryReturn {
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await getIncidentSummary();
      setSummary(data);
      setState("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar resumen"
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, state, error, refetch: fetchSummary };
}
