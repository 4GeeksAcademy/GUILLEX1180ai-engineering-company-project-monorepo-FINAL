"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

/**
 * useAuthGuard — Protección de rutas en el cliente.
 *
 * Verifica la existencia de un token en localStorage al montar.
 * Si no hay token, redirige automáticamente a /login.
 *
 * Devuelve:
 *   - isChecking: true mientras se verifica (útil para mostrar loading)
 *   - isAuthenticated: true si hay token presente
 */
export function useAuthGuard(): { isChecking: boolean; isAuthenticated: boolean } {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }

    setIsChecking(false);
  }, [router]);

  return { isChecking, isAuthenticated };
}