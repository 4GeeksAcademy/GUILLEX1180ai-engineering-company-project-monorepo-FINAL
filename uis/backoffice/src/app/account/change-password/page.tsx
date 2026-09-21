// ──────────────────────────────────────────────
// Change Password — Cambiar contraseña (protegido)
// Ruta: /account/change-password (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { changePassword, logout } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function ChangePasswordPage() {
  const { isChecking, isAuthenticated } = useAuthGuard();
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, []);

  // Errores de validación en cliente
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    let valid = true;

    if (!currentPassword) {
      setCurrentError("Debes ingresar tu contraseña actual.");
      valid = false;
    } else {
      setCurrentError(null);
    }

    if (!newPassword || newPassword.length < 6) {
      setNewPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      valid = false;
    } else {
      setNewPasswordError(null);
    }

    if (newPassword !== confirmPassword) {
      setConfirmError("Las contraseñas no coinciden.");
      valid = false;
    } else {
      setConfirmError(null);
    }

    if (currentPassword && currentPassword === newPassword && newPassword.length >= 6) {
      setNewPasswordError("La nueva contraseña debe ser diferente a la actual.");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);

      // Cerrar sesión después de 2 segundos (usando ref para cleanup)
      logoutTimerRef.current = setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";

      if (message.includes("400")) {
        const match = message.match(/\{.*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            setError(parsed.detail || "Error al cambiar la contraseña.");
          } catch {
            setError("Error al cambiar la contraseña. Verifica tus datos.");
          }
        } else {
          setError("Error al cambiar la contraseña. Verifica tus datos.");
        }
      } else if (message.includes("401")) {
        setError("Sesión expirada. Serás redirigido al inicio de sesión.");
        setTimeout(() => logout(), 1500);
      } else if (message.includes("Failed to fetch") || message.includes("TypeError")) {
        setError("Error de conexión. Verifica que el servidor esté corriendo.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Verificación de autenticación
  if (isChecking) {
    return <LoadingSpinner message="Verificando sesión…" />;
  }

  if (!isAuthenticated) {
    return null; // La redirección ocurre en useAuthGuard
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✅
          </div>
          <h1 className="mb-2 text-xl font-bold text-green-800">
            Contraseña cambiada
          </h1>
          <p className="mb-4 text-sm text-green-700">
            Tu contraseña se ha actualizado. Serás redirigido al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tf-dark">Cambiar contraseña</h1>
          <p className="mt-1 text-sm text-gray-500">
            Actualiza tu contraseña de acceso
          </p>
        </div>
        <Link
          href="/account/profile"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Volver al perfil
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Contraseña actual */}
          <div>
            <label
              htmlFor="change-current-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Contraseña actual
            </label>
            <input
              id="change-current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setCurrentError(null);
              }}
              disabled={loading}
              placeholder="••••••••"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                currentError
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {currentError && (
              <p className="mt-1 text-xs text-red-600">{currentError}</p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div>
            <label
              htmlFor="change-new-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nueva contraseña
            </label>
            <input
              id="change-new-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setNewPasswordError(null);
              }}
              disabled={loading}
              placeholder="Mín. 6 caracteres"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                newPasswordError
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {newPasswordError && (
              <p className="mt-1 text-xs text-red-600">{newPasswordError}</p>
            )}
          </div>

          {/* Confirmar nueva contraseña */}
          <div>
            <label
              htmlFor="change-confirm-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirmar nueva contraseña
            </label>
            <input
              id="change-confirm-password"
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
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center rounded-lg bg-tf-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-tf-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Cambiando…
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </button>
            <Link
              href="/account/profile"
              className="flex items-center rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}