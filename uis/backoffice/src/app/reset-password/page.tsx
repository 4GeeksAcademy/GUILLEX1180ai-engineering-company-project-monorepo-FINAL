// ──────────────────────────────────────────────
// Reset Password — Restablecer contraseña
// Ruta: /reset-password?token=<token> (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useRef, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";

/**
 * Contenido interno que usa useSearchParams (requiere Suspense boundary).
 */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  // Validación en cliente
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Enlace inválido. No se encontró el token de restablecimiento.");
    }
  }, [token]);

  const validateForm = useCallback((): boolean => {
    let valid = true;

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      valid = false;
    } else {
      setPasswordError(null);
    }

    if (newPassword !== confirmPassword) {
      setConfirmError("Las contraseñas no coinciden.");
      valid = false;
    } else {
      setConfirmError(null);
    }

    return valid;
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await resetPassword({ token, new_password: newPassword });
      setSuccess(true);

      // Redirigir al login después de 3 segundos
      redirectTimerRef.current = setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";

      if (message.includes("400")) {
        const match = message.match(/\{.*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            setError(parsed.detail || "Token inválido o expirado.");
          } catch {
            setError("Token inválido o expirado. Solicita uno nuevo.");
          }
        } else {
          setError("Token inválido o expirado. Solicita uno nuevo.");
        }
      } else if (message.includes("Failed to fetch") || message.includes("TypeError")) {
        setError("Error de conexión. Verifica que el servidor esté corriendo.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-red-700">Enlace inválido</h1>
          <p className="mb-4 text-sm text-red-600">
            No se encontró un token de restablecimiento en la URL.
          </p>
          <Link
            href="/forgot-password"
            className="font-medium text-tf-blue hover:text-tf-blue-dark"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✅
          </div>
          <h1 className="mb-2 text-xl font-bold text-green-800">
            Contraseña restablecida
          </h1>
          <p className="mb-4 text-sm text-green-700">
            Tu contraseña se ha actualizado correctamente. Serás redirigido al inicio de sesión...
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-tf-blue px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-tf-blue-dark"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      {/* ── Card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Encabezado */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-tf-blue text-xl font-bold text-white">
            TF
          </div>
          <h1 className="text-xl font-bold text-tf-dark">Restablecer contraseña</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresa tu nueva contraseña
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Nueva contraseña */}
          <div>
            <label
              htmlFor="reset-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nueva contraseña
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError(null);
              }}
              disabled={loading}
              placeholder="Mín. 6 caracteres"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                passwordError
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-600">{passwordError}</p>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label
              htmlFor="reset-confirm-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirmar contraseña
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmError(null);
              }}
              disabled={loading}
              placeholder="Repite la contraseña"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                confirmError
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {confirmError && (
              <p className="mt-1 text-xs text-red-600">{confirmError}</p>
            )}
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
                Restableciendo…
              </>
            ) : (
              "Restablecer contraseña"
            )}
          </button>
        </form>

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

/**
 * Página principal envuelta en Suspense para useSearchParams.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
          <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-gray-200" />
            <div className="mx-auto mb-2 h-6 w-48 rounded bg-gray-200" />
            <div className="mx-auto h-4 w-64 rounded bg-gray-200" />
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}