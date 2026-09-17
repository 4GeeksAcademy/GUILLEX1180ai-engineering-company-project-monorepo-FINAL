import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import type { Candidate } from "@/lib/types";

export default function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Link
      href={`/candidates/${candidate.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-5
                 hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
          {candidate.first_name} {candidate.last_name}
        </h2>
        <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">
          #{candidate.id}
        </span>
      </div>

      {/* Puesto */}
      {candidate.job_title && (
        <p className="text-sm text-gray-700 mb-3 font-medium">💼 {candidate.job_title}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <StatusBadge value={candidate.status} type="status" />
        <StatusBadge value={candidate.stage} type="stage" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-3">
        <span>
          {candidate.years_experience != null
            ? `${candidate.years_experience} años exp.`
            : "—"}
        </span>
        <span className="text-blue-600 group-hover:text-blue-800 font-medium">
          Ver detalles →
        </span>
      </div>
    </Link>
  );
}
