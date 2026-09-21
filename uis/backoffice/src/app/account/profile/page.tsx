// ──────────────────────────────────────────────
// Account Profile — Gestión de perfil de usuario
// Ruta: /account/profile (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { getProfile, updateProfile, getToken, logout } from "@/lib/api";
import type { UserProfile, ProfileUpdatePayload } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";

interface ProfileForm {
  name: string;
  phone: string;
  address: string;
}

export default function AccountProfilePage() {
  const { isChecking, isAuthenticated } = useAuthGuard();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      loadProfile();
    }
  }, [isChecking, isAuthenticated]);

  const loadProfile = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getProfile();
      setProfile(data);
      setForm({
        name: data.name ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
      });
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Error al cargar el perfil"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMsg(null);
    setSaveError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSuccessMsg(null);

    try {
      const payload: ProfileUpdatePayload = {};
      if (form.name !== (profile?.name ?? "")) payload.name = form.name;
      if (form.phone !== (profile?.phone ?? "")) payload.phone = form.phone;
      if (form.address !== (profile?.address ?? "")) payload.address = form.address;

      if (Object.keys(payload).length === 0) {
        setSuccessMsg("No hay cambios que guardar.");
        setSaving(false);
        return;
      }

      const updated = await updateProfile(payload);
      setProfile(updated);
      setSuccessMsg("Perfil actualizado correctamente.");
      setIsEditing(false);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Error al guardar el perfil"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: profile?.name ?? "",
      phone: profile?.phone ?? "",
      address: profile?.address ?? "",
    });
    setIsEditing(false);
    setSaveError(null);
    setSuccessMsg(null);
  };

  // Estado de verificación inicial
  if (isChecking) {
    return <LoadingSpinner message="Verificando sesión…" />;
  }

  if (!isAuthenticated) {
    return null; // La redirección ocurre en useAuthGuard
  }

  // Error al cargar perfil
  if (loading) {
    return <LoadingSpinner message="Cargando perfil…" />;
  }

  if (fetchError) {
    return <ErrorMessage title="Error de perfil" message={fetchError} showBack />;
  }

  if (!profile) {
    return <ErrorMessage title="Error" message="No se pudo cargar el perfil." showBack />;
  }

  const hasChanges =
    form.name !== (profile.name ?? "") ||
    form.phone !== (profile.phone ?? "") ||
    form.address !== (profile.address ?? "");

  return (
    <div className="mx-auto max-w-2xl">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tf-dark">Mi cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona tu información personal
          </p>
        </div>
          <div className="flex items-center gap-2">
            <Link
              href="/account/change-password"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cambiar contraseña
            </Link>
            <button
              onClick={logout}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Cerrar sesión
            </button>
          </div>
      )}
      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Card del perfil */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Email (no editable) */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Correo electrónico
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-tf-dark">
              {profile.email}
            </span>
            <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
              No editable
            </span>
          </div>
        </div>

        {/* Formulario editable */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label
              htmlFor="profile-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nombre completo
            </label>
            <input
              id="profile-name"
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={!isEditing || saving}
              placeholder="Sin especificar"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                !isEditing
                  ? "bg-gray-50 text-gray-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label
              htmlFor="profile-phone"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Teléfono
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              disabled={!isEditing || saving}
              placeholder="Sin especificar"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                !isEditing
                  ? "bg-gray-50 text-gray-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
          </div>

          {/* Dirección */}
          <div>
            <label
              htmlFor="profile-address"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Dirección
            </label>
            <input
              id="profile-address"
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              disabled={!isEditing || saving}
              placeholder="Sin especificar"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-tf-dark placeholder-gray-400 outline-none transition-colors focus:ring-2 focus:ring-tf-blue/30 ${
                !isEditing
                  ? "bg-gray-50 text-gray-500"
                  : "border-gray-300 focus:border-tf-blue"
              }`}
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="flex items-center justify-center rounded-lg bg-tf-blue px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-tf-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-tf-blue px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-tf-blue-dark"
              >
                Editar perfil
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Metadatos */}
      <div className="mt-4 text-xs text-gray-400">
        <p>
          Creado: {new Date(profile.created_at).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {profile.updated_at && (
          <p className="mt-1">
            Última actualización:{" "}
            {new Date(profile.updated_at).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
  );
}