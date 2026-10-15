// ──────────────────────────────────────────────
// Página: Redirección de Inventario
// Ruta: /inventory → /inventory/products
// ──────────────────────────────────────────────

import { redirect } from "next/navigation";

export default function InventoryPage() {
  redirect("/inventory/products");
}