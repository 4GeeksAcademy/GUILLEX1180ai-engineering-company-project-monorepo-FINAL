// ──────────────────────────────────────────────
// Forgot Password — Solicitar restablecimiento
// Ruta: /forgot-password (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import type { ForgotPasswordPayload, ForgotPasswordResponse } from "@/lib/types";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [response, setResponse] = useState<ForgotPasswordResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Limpiar el timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const startCooldown = () => {
    setCooldown(30);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const payload: ForgotPasswordPayload = { email };
      const result = await forgotPassword(payload);
      setResponse(result);

      // Deshabilitar temporalmente el botón por 30 segundos
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al solicitar restablecimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      {/* ── Card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Encabezado */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-tf-blue text-xl font-bold text-white">
            TF
          </div>
          <h1 className="text-xl font-bold text-tf-dark">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresa tu correo y te enviaremos un enlace de restablecimiento
          </p>
        </div>

        {/* Mensaje de éxito neutral */}
        {response && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {response.message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Formulario */}
        {!response && (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="forgot-email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Correo electrónico
              </label>
              <input
                id="forgot-email"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="flex w-full items-center justify-center rounded-lg bg-tf-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-tf-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enviando…
                </>
              ) : cooldown > 0 ? (
                `Reintentar en ${cooldown}s`
              ) : (
                "Enviar enlace"
              )}
            </button>
          </form>
        )}

        {/* Volver al login */}
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link
            href="/login"
            className="font-medium text-tf-blue hover:text-tf-blue-dark"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}