// ──────────────────────────────────────────────
// Página principal: Listado de Leads
// Ruta: / (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { Suspense, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLeads } from "@/hooks/useLeads";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { LeadCard } from "@/components/LeadCard";
import { LEAD_STATUS_OPTIONS, LEAD_STAGE_OPTIONS, humanize } from "@/lib/types";

function LeadListContent() {
  const { leads, state, error, refetch } = useLeads();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const statusFilter = searchParams.get("status") ?? "";
  const stageFilter = searchParams.get("stage") ?? "";
  const searchQuery = searchParams.get("q") ?? "";

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter && lead.status !== statusFilter) return false;
      if (stageFilter && lead.stage !== stageFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          lead.company_name.toLowerCase().includes(q) ||
          lead.contact_person.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, statusFilter, stageFilter, searchQuery]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleSearch = useCallback(() => {
    updateFilter("q", localSearch);
  }, [localSearch, updateFilter]);

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
    setLocalSearch("");
  }, [router, pathname]);

  // ─── Estados ───

  if (state === "loading") {
    return <LoadingSpinner message="Cargando leads…" />;
  }

  if (state === "error") {
    return (
      <div className="space-y-4">
        <ErrorMessage
          title="Error al cargar leads"
          message={error ?? "Ocurrió un error inesperado"}
        />
        <div className="text-center">
          <button
            onClick={refetch}
            className="rounded-lg bg-tf-blue px-4 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (state === "success" && leads.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-tf-dark">Aún no hay leads</h2>
        <p className="mt-2 text-gray-500">
          Los leads capturados desde el formulario web aparecerán aquí.
        </p>
        <a
          href="/candidates/new"
          className="mt-6 inline-block rounded-lg bg-tf-blue px-6 py-3 text-white hover:bg-tf-blue-dark transition-colors"
        >
          Crear primer lead
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tf-dark">
          Leads Comerciales
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {leads.length} lead{leads.length !== 1 ? "s" : ""} en total
          {filtered.length < leads.length && ` · ${filtered.length} filtrados`}
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
        {/* Búsqueda */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Buscar
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Empresa, contacto o email…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none focus:ring-1 focus:ring-tf-blue-light"
            />
            <button
              onClick={handleSearch}
              className="rounded-lg bg-tf-blue px-4 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Filtro Status */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
          >
            <option value="">Todos</option>
            {LEAD_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Stage */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Etapa
          </label>
          <select
            value={stageFilter}
            onChange={(e) => updateFilter("stage", e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
          >
            <option value="">Todos</option>
            {LEAD_STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        </div>

        {/* Limpiar */}
        {(statusFilter || stageFilter || searchQuery) && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid de leads */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No se encontraron leads con estos filtros.
          </p>
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-tf-blue hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

// Page wrapper con Suspense por useSearchParams
export default function LeadsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Cargando leads…" />}>
      <LeadListContent />
    </Suspense>
  );
}