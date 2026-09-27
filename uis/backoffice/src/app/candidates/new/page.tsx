// ──────────────────────────────────────────────
// Nuevo lead
// Ruta: /candidates/new
// ──────────────────────────────────────────────

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Lazy loading: formulario pesado con múltiples fieldsets
// Se carga solo cuando el usuario navega a esta ruta secundaria
const NewLeadForm = dynamic(
  () => import("./NewLeadForm").then((m) => m.NewLeadForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
        ))}
      </div>
    ),
  }
);

export default function NewLeadPage() {
  const router = useRouter();
  const { isChecking, isAuthenticated } = useAuthGuard();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (isChecking) return <LoadingSpinner message="Verificando sesión…" fullPage />;
  if (!isAuthenticated) return null;

  if (success) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h2 className="text-xl font-semibold text-tf-dark">Lead creado exitosamente</h2>
        <p className="mt-2 text-gray-500">Redirigiendo al listado…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-tf-blue hover:underline"
        >
          ← Volver al listado
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-tf-dark">Nuevo Lead Comercial</h1>
        <p className="text-sm text-gray-500">
          Captura un nuevo lead proveniente del formulario web o de una llamada comercial.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Formulario lazy loaded ── */}
      <NewLeadForm
        onCreated={() => {
          setSuccess(true);
          setTimeout(() => router.push("/"), 800);
        }}
        onError={(msg) => setError(msg)}
        sending={sending}
        setSending={setSending}
      />
    </div>
  );
}