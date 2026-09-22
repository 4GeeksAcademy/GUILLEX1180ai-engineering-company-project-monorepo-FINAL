// ──────────────────────────────────────────────
// useIncidents — Hook de análisis de incidencias
// Backoffice TrackFlow
// ──────────────────────────────────────────────

"use client";

import { useState, useCallback } from "react";
import type { LoadingState } from "@/lib/types";

/* ─── Tipos ─── */

export interface ErrorDetail {
  tipo: string;
  cantidad: number;
}

export interface AnalisisResponse {
  total_registros: number;
  registros_validos: number;
  registros_invalidos: number;
  errores_por_tipo: ErrorDetail[];
  categorias: Record<string, number>;
  estados: Record<string, number>;
  satisfaccion_media: number | null;
  total_cerrados_con_puntuacion: number;
  analizado_en: string;
}

export interface UseIncidentsReturn {
  result: AnalisisResponse | null;
  state: LoadingState;
  error: string | null;
  analyze: (file: File) => Promise<void>;
  downloadCsv: () => Promise<void>;
  reset: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ─── Hook ─── */

export function useIncidents(): UseIncidentsReturn {
  const [result, setResult] = useState<AnalisisResponse | null>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File) => {
    setState("loading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      let res: Response;
      try {
        res = await fetch(`${API_BASE}/incidents/analyze`, {
          method: "POST",
          body: formData,
        });
      } catch (networkErr) {
        // Error de red: servidor caído, DNS, CORS, etc.
        const msg =
          networkErr instanceof TypeError
            ? `Error de red — No se pudo conectar con el servidor (${API_BASE}/incidents/analyze). Verifica que el backend esté corriendo.`
            : `Error de conexión: ${networkErr}`;
        throw new Error(msg);
      }

      if (!res.ok) {
        // Intentar parsear el body como JSON (error controlado del backend)
        let detail: string;
        try {
          const body = await res.json();
          detail = body?.detail ?? `Error HTTP ${res.status}: ${res.statusText}`;
        } catch {
          // Si no es JSON (ej. HTML 500 sin handler), usar mensaje genérico
          detail = `Error HTTP ${res.status} — El servidor devolvió una respuesta inesperada.`;
        }
        throw new Error(detail);
      }

      const data: AnalisisResponse = await res.json();
      setResult(data);
      setState("success");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error desconocido al analizar";
      setError(msg);
      setState("error");
    }
  }, []);

  const downloadCsv = useCallback(async () => {
    try {
      let res: Response;
      try {
        res = await fetch(`${API_BASE}/incidents/results/export`);
      } catch (networkErr) {
        const msg =
          networkErr instanceof TypeError
            ? `Error de red — No se pudo conectar con el servidor para la descarga.`
            : `Error de conexión: ${networkErr}`;
        throw new Error(msg);
      }

      if (!res.ok) {
        let detail: string;
        try {
          const body = await res.json();
          detail = body?.detail ?? `Error HTTP ${res.status}: ${res.statusText}`;
        } catch {
          detail = `Error HTTP ${res.status} al descargar resultados.`;
        }
        throw new Error(detail);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "results.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al descargar CSV";
      setError(msg);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setState("idle");
    setError(null);
  }, []);

  return { result, state, error, analyze, downloadCsv, reset };
}