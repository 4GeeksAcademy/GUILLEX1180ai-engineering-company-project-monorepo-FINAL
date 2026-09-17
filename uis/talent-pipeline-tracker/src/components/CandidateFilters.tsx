"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { STATUS_OPTIONS, STAGE_OPTIONS } from "@/lib/types";

export default function CandidateFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentStatus  = searchParams.get("status")  ?? "";
  const currentStage   = searchParams.get("stage")   ?? "";
  const currentSearch  = searchParams.get("q")       ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Búsqueda por nombre / email */}
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          defaultValue={currentSearch}
          onChange={(e) => updateParam("q", e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filtro por estado */}
      <select
        value={currentStatus}
        onChange={(e) => updateParam("status", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todos los estados</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Filtro por etapa */}
      <select
        value={currentStage}
        onChange={(e) => updateParam("stage", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todas las etapas</option>
        {STAGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
