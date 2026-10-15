// ──────────────────────────────────────────────
// Tipos del dominio de Inventario (TrackFlow)
// Alineados con CONTEXT.es.md y services/api/schemas/stock.py
//
// Vocabulario del dominio (CONTEXT.es.md):
//   - Producto / SKU: cada ítem almacenable con identificador único
//   - Almacén (bodega): Los Ángeles (LA) y Zaragoza (ZGZ)
//   - Entrada (Inbound): recepción de mercancía al almacén
//   - Salida (Outbound): consumo/despacho desde el almacén
//   - Stock: cálculo en tiempo real (SUM entradas - SUM salidas)
// ──────────────────────────────────────────────

/* ─── Producto / SKU ─── */

export interface InventoryProduct {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;        // Moda / Electrónica / Cosmética / Alimentación / Otro
  unit: string | null;            // unidad, caja, kg, litro...
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_stock: number;          // CALCULADO: SUM(entradas) - SUM(salidas)
}

/* ─── Almacén / Bodega ─── */

export interface Warehouse {
  id: number;
  code: string;                   // LA / ZGZ
  name: string;                   // Los Ángeles / Zaragoza
  city: string;
  country: string;
  is_active: boolean;
}

/* ─── Órdenes de stock ─── */

export type OrderType = "inbound" | "outbound";

export interface InventoryOrder {
  id: number;
  type: OrderType;
  item_id: number;
  warehouse_id: number;
  quantity: number;
  user_uuid: string;
  notes: string | null;           // Solo inbound
  reason: string | null;          // Solo outbound
  destination: string | null;     // Solo outbound
  created_at: string;
}

export interface OrderListResponse {
  orders: InventoryOrder[];
  total: number;
}

/* ─── Payloads de creación ─── */

export interface InboundOrderPayload {
  item_id: number;
  warehouse_id: number;
  quantity: number;
  notes?: string;
}

export interface OutboundOrderPayload {
  item_id: number;
  warehouse_id: number;
  quantity: number;
  reason?: string;
  destination?: string;
}

/* ─── Respuestas de creación ─── */

export interface InboundOrderResponse {
  id: number;
  item_id: number;
  warehouse_id: number;
  quantity: number;
  user_uuid: string;
  notes: string | null;
  created_at: string;
}

export interface OutboundOrderResponse {
  id: number;
  item_id: number;
  warehouse_id: number;
  quantity: number;
  user_uuid: string;
  reason: string | null;
  destination: string | null;
  created_at: string;
}

/* ─── Estados de formulario ─── */

export type FormStatus = "idle" | "submitting" | "success" | "error";

/* ─── Umbrales de stock ───

  Criterio documentado (CONTEXT.es.md — productos de e-commerce):
  - Stock BAJO:    current_stock <= STOCK_THRESHOLD_LOW
  - Stock MEDIO:   current_stock > LOW y <= STOCK_THRESHOLD_MEDIUM
  - Stock SALUDABLE: current_stock > STOCK_THRESHOLD_MEDIUM

  Asume rotación mensual media-alta (moda, electrónica, cosmética).
*/

export const STOCK_THRESHOLD_LOW = 10;
export const STOCK_THRESHOLD_MEDIUM = 50;