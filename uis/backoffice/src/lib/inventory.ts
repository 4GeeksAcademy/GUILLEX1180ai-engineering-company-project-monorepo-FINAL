// ──────────────────────────────────────────────
// inventory.ts — Módulo de integración de Inventario
// Backoffice TrackFlow
//
// Centraliza TODAS las llamadas HTTP a los endpoints /inventory.
// Ningún componente debe invocar fetch o axios directamente.
//
// Endpoints:
//   GET  /inventory/products              → inventoryApi.getProducts()
//   POST /inventory/orders/inbound        → inventoryApi.createInboundOrder()
//   POST /inventory/orders/outbound       → inventoryApi.createOutboundOrder()
//   GET  /inventory/orders                → inventoryApi.getOrders()
// ──────────────────────────────────────────────

import { getToken, removeToken, redirectToLogin } from "./api";
import type {
  InventoryProduct,
  InventoryOrder,
  OrderListResponse,
  InboundOrderPayload,
  InboundOrderResponse,
  OutboundOrderPayload,
  OutboundOrderResponse,
  Warehouse,
} from "@/types/inventory";

// ─── URL base ──────────────────────────────────────────────
// Lee de NEXT_PUBLIC_INVENTORY_API_URL (default: http://localhost:8000)
// Si la variable no está definida, cae en NEXT_PUBLIC_API_URL.
const INVENTORY_API_BASE = (
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000"
).trim();

/**
 * Resuelve la URL absoluta para un path del módulo /inventory.
 *
 * Si la base es absoluta (http/https) se usa tal cual (entorno standalone).
 * Si es relativa o vacía, se asume /api/v1 como prefijo para que la
 * petición viaje por el proxy de Next.js (next.config.js rewrites).
 */
function resolveUrl(path: string): string {
  const isAbsolute =
    INVENTORY_API_BASE.startsWith("http://") ||
    INVENTORY_API_BASE.startsWith("https://");
  const base = isAbsolute ? INVENTORY_API_BASE : "/api/v1";
  const separator = base.endsWith("/") ? "" : "/";
  return `${base}${separator}inventory/${path.replace(/^\//, "")}`;
}

/**
 * inventoryFetch — Fetch interno autenticado.
 *
 * - Adjunta automáticamente Authorization: Bearer <token>.
 * - Si no hay token disponible, redirige a /login.
 * - Si el servidor responde 401, limpia el token y redirige.
 * - Si la respuesta es 4xx/5xx, parsea error.detail (FastAPI)
 *   y lanza un Error con mensaje legible para el usuario.
 *
 * @throws Error con mensaje descriptivo (NUNCA silencia errores).
 */
async function inventoryFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();

  if (!token) {
    redirectToLogin();
    throw new Error("Sesión no iniciada. Redirigiendo al login…");
  }

  const url = resolveUrl(path);

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });
  } catch (_err) {
    // Error de red: servidor caído, DNS, CORS, etc.
    throw new Error(
      `Error de conexión — No se pudo contactar el servidor de inventario (${url}). Verifica que el backend esté en ejecución.`
    );
  }

  // ── 401: token inválido o expirado ──
  if (res.status === 401) {
    removeToken();
    redirectToLogin();
    throw new Error("La sesión ha expirado. Redirigiendo al login…");
  }

  // ── 4xx / 5xx: parsear detalle de la API ──
  if (!res.ok) {
    let detail: string;
    try {
      const body = await res.json();
      // FastAPI envía errores en detail (string | array de FieldError)
      if (typeof body?.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body?.detail)) {
        detail = body.detail.map((e: { msg?: string; loc?: string[] }) =>
          e.msg ?? `Error en campo ${(e.loc ?? []).join(".")}`
        ).join("; ");
      } else if (typeof body?.message === "string") {
        detail = body.message;
      } else {
        detail = `Error HTTP ${res.status} (${res.statusText})`;
      }
    } catch {
      // Respuesta no JSON (ej. HTML 500 sin manejador global)
      const textBody = await res.text().catch(() => "");
      detail = `Error HTTP ${res.status} — Respuesta inesperada del servidor.${textBody ? ` ${textBody.slice(0, 200)}` : ""}`;
    }
    throw new Error(detail);
  }

  // ── 204 No Content (ej. DELETE exitoso) ──
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ═══════════════════════════════════════════════════════════
// inventoryApi — Objeto exportado con todos los métodos
// ═══════════════════════════════════════════════════════════

export const inventoryApi = {
  // ── 0. Almacenes ─────────────────────────────────────────

  /**
   * GET /warehouses
   * Retorna la lista completa de almacenes/bodegas.
   */
  async getWarehouses(): Promise<Warehouse[]> {
    // Reutilizamos inventoryFetch apuntando a /warehouses
    return inventoryFetch<Warehouse[]>("/warehouses");
  },

  // ── 1. Productos ─────────────────────────────────────────

  /**
   * GET /inventory/products
   * Retorna la lista completa de productos con su stock actual calculado.
   */
  async getProducts(): Promise<InventoryProduct[]> {
    return inventoryFetch<InventoryProduct[]>("/products");
  },

  /**
   * GET /inventory/products/:id
   * Retorna un producto por su ID con stock actual calculado.
   */
  async getProductById(id: number): Promise<InventoryProduct> {
    return inventoryFetch<InventoryProduct>(`/products/${id}`);
  },

  // ── 2. Órdenes de Entrada (Inbound) ───────────────────────

  /**
   * POST /inventory/orders/inbound
   * Registra una entrada de stock (recepción de mercancía).
   *
   * @param payload Datos de la entrada (producto, almacén, cantidad, notas)
   * @returns La orden de entrada creada
   */
  async createInboundOrder(
    payload: InboundOrderPayload
  ): Promise<InboundOrderResponse> {
    return inventoryFetch<InboundOrderResponse>("/orders/inbound", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ── 3. Órdenes de Salida (Outbound) ───────────────────────

  /**
   * POST /inventory/orders/outbound
   * Registra una salida de stock (consumo/despacho).
   *
   * Maneja HTTP 400 (stock insuficiente) lanzando el mensaje
   * de error de la API (ej: "Stock insuficiente para el producto X").
   *
   * @param payload Datos de la salida (producto, almacén, cantidad, motivo, destino)
   * @returns La orden de salida creada
   */
  async createOutboundOrder(
    payload: OutboundOrderPayload
  ): Promise<OutboundOrderResponse> {
    return inventoryFetch<OutboundOrderResponse>("/orders/outbound", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ── 4. Historial de Órdenes ───────────────────────────────

  /**
   * GET /inventory/orders
   * Retorna el listado completo de órdenes (entradas y salidas).
   * Solo lectura — sin operaciones de edición ni borrado.
   *
   * @param itemId     (opcional) Filtrar por producto
   * @param warehouseId (opcional) Filtrar por almacén
   */
  async getOrders(
    itemId?: number,
    warehouseId?: number
  ): Promise<OrderListResponse> {
    const params = new URLSearchParams();
    if (itemId !== undefined) params.set("item_id", String(itemId));
    if (warehouseId !== undefined)
      params.set("warehouse_id", String(warehouseId));
    const qs = params.toString();
    return inventoryFetch<OrderListResponse>(`/orders${qs ? `?${qs}` : ""}`);
  },
};

export type InventoryApi = typeof inventoryApi;