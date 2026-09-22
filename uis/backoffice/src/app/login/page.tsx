// ──────────────────────────────────────────────
// Login — Inicio de sesión
// Ruta: /login (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, storeToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });
      storeToken(response.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      {/* ── Card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Logo / Encabezado */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-tf-blue text-xl font-bold text-white">
            TF
          </div>
          <h1 className="text-xl font-bold text-tf-dark">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-gray-500">
            Accede al panel interno de TrackFlow
          </p>
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="tu@correo.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:border-tf-blue focus:ring-2 focus:ring-tf-blue/30"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:border-tf-blue focus:ring-2 focus:ring-tf-blue/30"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-tf-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-tf-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Iniciando sesión…
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {/* Registro */}
        <p className="mt-6 text-center text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-tf-blue hover:text-tf-blue-dark"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}