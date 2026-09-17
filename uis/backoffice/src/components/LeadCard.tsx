// ──────────────────────────────────────────────
// LeadCard — Tarjeta de lead en el listado
// ──────────────────────────────────────────────

"use client";

import Link from "next/link";
import type { Lead } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  return (
    <Link
      href={`/candidates/${lead.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-tf-blue-light"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-tf-dark">
            {lead.company_name}
          </h3>
          <p className="text-sm text-gray-500">{lead.contact_person}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge value={lead.status} type="status" />
          <StatusBadge value={lead.stage} type="stage" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
        <span>{lead.email}</span>
        <span>{lead.phone}</span>
        <span>{lead.country}</span>
        <span>{lead.product_type}</span>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Creado: {new Date(lead.created_at).toLocaleDateString("es-ES")}
      </p>
    </Link>
  );
}