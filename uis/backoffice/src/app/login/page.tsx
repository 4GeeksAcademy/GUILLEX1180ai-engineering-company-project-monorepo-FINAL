// ──────────────────────────────────────────────
// Login — Inicio de sesión
// Ruta: /login (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, storeToken } from "@/lib/api";
import type { ValidationErrorResponse, FieldError } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors([]);

    try {
      const response = await login({ email, password });
      storeToken(response.access_token);
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";

      // Intentar extraer errores de validación por campo
      try {
        const body = JSON.parse(
          (err instanceof Error ? err.message.split(": ").slice(1).join(": ") : "{}")
        );
        if (body?.detail && Array.isArray(body.detail)) {
          setFieldErrors(body.detail as FieldError[]);
        } else {
          setError(typeof body?.detail === "string" ? body.detail : message);
        }
      } catch {
        // Si el mensaje contiene un JSON en el body, extraerlo
        const match = message.match(/\{.*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]) as ValidationErrorResponse;
            if (Array.isArray(parsed.detail)) {
              setFieldErrors(parsed.detail);
            } else {
              setError(parsed.detail);
            }
          } catch {
            setError(message);
          }
        } else {
          // Errores HTTP conocidos
          if (message.includes("401") || message.includes("403")) {
            setError("Credenciales inválidas. Verifica tu email y contraseña.");
          } else if (message.includes("400") || message.includes("422")) {
            setError("Datos inválidos. Revisa los campos del formulario.");
          } else if (message.includes("000") || message.includes("Failed to fetch") || message.includes("TypeError")) {
            setError("Error de conexión. Verifica que el servidor esté corriendo.");
          } else {
            setError(message);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string): string | undefined =>
    fieldErrors.find((fe) => fe.field === field)?.message;

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
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                getFieldError("email")
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {getFieldError("email") && (
              <p className="mt-1 text-xs text-red-600">{getFieldError("email")}</p>
            )}
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
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                getFieldError("password")
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {getFieldError("password") && (
              <p className="mt-1 text-xs text-red-600">{getFieldError("password")}</p>
            )}
            <div className="mt-1 text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-tf-blue hover:text-tf-blue-dark transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
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