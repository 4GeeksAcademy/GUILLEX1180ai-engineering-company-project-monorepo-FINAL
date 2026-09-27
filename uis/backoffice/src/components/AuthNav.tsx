// ──────────────────────────────────────────────
// AuthNav — Navegación condicional según autenticación
// ──────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken, logout } from "@/lib/api";

export function AuthNav() {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setToken(getToken());
  }, []);

  // Placeholder invisible de misma dimensiones para evitar CLS
  if (!mounted) {
    return (
      <div className="flex items-center gap-3 text-sm font-medium" aria-hidden="true" style={{ visibility: "hidden" }}>
        <span>Mi cuenta</span>
        <span className="rounded-lg border border-red-300 px-4 py-2">Cerrar sesión</span>
      </div>
    );
  }

  if (token) {
    return (
      <div className="flex items-center gap-3 text-sm font-medium">
        <Link
          href="/account/profile"
          className="text-gray-500 hover:text-tf-blue transition-colors"
        >
          Mi cuenta
        </Link>
        <button
          onClick={logout}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm font-medium">
      <Link
        href="/login"
        className="text-gray-500 hover:text-tf-blue transition-colors"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/register"
        className="rounded-lg border border-tf-blue px-4 py-2 text-tf-blue hover:bg-tf-blue hover:text-white transition-colors"
      >
        Registrarse
      </Link>
    </div>
  );
}