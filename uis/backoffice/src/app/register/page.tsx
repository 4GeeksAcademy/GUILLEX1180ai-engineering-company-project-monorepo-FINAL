// ──────────────────────────────────────────────
// Register — Registro de nuevo usuario
// Ruta: /register (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, login, storeToken } from "@/lib/api";
import type { FieldError } from "@/lib/types";

interface FormFields {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

const INITIAL_FORM: FormFields = {
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormFields>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  const updateField = (field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getFieldError = (field: string): string | undefined =>
    fieldErrors.find((fe) => fe.field === field)?.message;

  const parseError = (err: unknown): void => {
    const message = err instanceof Error ? err.message : "Error desconocido";

    // Intentar extraer errores de validación por campo desde JSON en el mensaje
    const match = message.match(/\{.*\}/s);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed.detail)) {
          setFieldErrors(parsed.detail as FieldError[]);
          return;
        }
        if (typeof parsed.detail === "string") {
          setError(parsed.detail);
          return;
        }
      } catch {
        // fallback
      }
    }

    // Errores HTTP conocidos
    if (message.includes("401") || message.includes("403")) {
      setError("Credenciales inválidas. Verifica tu email y contraseña.");
    } else if (message.includes("409")) {
      setError("Este correo electrónico ya está registrado.");
    } else if (message.includes("400") || message.includes("422")) {
      setError("Datos inválidos. Revisa los campos del formulario.");
    } else if (message.includes("000") || message.includes("Failed to fetch") || message.includes("TypeError")) {
      setError("Error de conexión. Verifica que el servidor esté corriendo.");
    } else {
      setError(message);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors([]);

    // Validación local básica
    if (!form.email || !form.password) {
      setError("El correo electrónico y la contraseña son obligatorios.");
      setLoading(false);
      return;
    }

    try {
      // 1. Registrar usuario
      await register({
        email: form.email,
        password: form.password,
        name: form.name || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });

      // 2. Login automático con las mismas credenciales
      const authResponse = await login({
        email: form.email,
        password: form.password,
      });

      // 3. Almacenar token
      storeToken(authResponse.access_token);

      // 4. Redirigir al dashboard
      router.push("/dashboard");
    } catch (err) {
      parseError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center">
      {/* ── Card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Logo / Encabezado */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-tf-blue text-xl font-bold text-white">
            TF
          </div>
          <h1 className="text-xl font-bold text-tf-dark">Crear cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Regístrate para acceder al panel de TrackFlow
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
          {/* Nombre */}
          <div>
            <label
              htmlFor="reg-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nombre completo <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={loading}
              placeholder="Juan Pérez"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                getFieldError("name")
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {getFieldError("name") && (
              <p className="mt-1 text-xs text-red-600">{getFieldError("name")}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
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
              htmlFor="reg-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              disabled={loading}
              placeholder="Mín. 6 caracteres"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                getFieldError("password")
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {getFieldError("password") && (
              <p className="mt-1 text-xs text-red-600">{getFieldError("password")}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label
              htmlFor="reg-phone"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Teléfono <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              disabled={loading}
              placeholder="+52 555 123 4567"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                getFieldError("phone")
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {getFieldError("phone") && (
              <p className="mt-1 text-xs text-red-600">{getFieldError("phone")}</p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label
              htmlFor="reg-address"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Dirección <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="reg-address"
              type="text"
              autoComplete="street-address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={loading}
              placeholder="Calle, ciudad, código postal"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                getFieldError("address")
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
            {getFieldError("address") && (
              <p className="mt-1 text-xs text-red-600">{getFieldError("address")}</p>
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
                Creando cuenta…
              </>
            ) : (
              "Crear cuenta"
            )}
          </button>
        </form>

        {/* Login */}
        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-tf-blue hover:text-tf-blue-dark"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}