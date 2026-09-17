import { Suspense } from "react";
import Link from "next/link";
import { CandidateForm } from "@/components";
import { LoadingSpinner } from "@/components";

export default function NewCandidatePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors"
      >
        ← Volver al listado
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Nuevo candidato</h1>
        <p className="text-sm text-gray-500 mb-6">
          Completa los datos para registrar una nueva candidatura.
        </p>

        <Suspense fallback={<LoadingSpinner message="Cargando formulario…" />}>
          <CandidateForm />
        </Suspense>
      </div>
    </div>
  );
}
