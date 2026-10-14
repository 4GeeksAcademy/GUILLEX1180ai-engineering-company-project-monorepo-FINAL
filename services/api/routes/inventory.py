"""Router de Inventario (TrackFlow) — Supabase / SQLModel.

Prefijo: /inventory (APIRouter dedicado).

Endpoints (nomenclatura del dominio: Product + Order):
  GET    /inventory/warehouses               — Lista de almacenes (LA / Zaragoza)
  POST   /inventory/products                 — Crea producto (Bearer; stock inicial 0)
  GET    /inventory/products                 — Lista productos con current_stock
  GET    /inventory/products/{item_id}       — Detalle con current_stock
  PATCH  /inventory/products/{item_id}       — Actualiza metadatos (sin stock)
  GET    /inventory/stock/{item_id}          — Stock calculado (alcance opcional)
  GET    /inventory/orders                   — Lista todas las órdenes (in+out)
  POST   /inventory/orders/inbound           — Orden de entrada de stock (Bearer)
  POST   /inventory/orders/outbound          — Orden de salida con validación (Bearer)

Arquitectura:
  - Sesión SQLModel inyectada por petición: `Depends(get_db)` (sin globals).
  - Los endpoints retornan SOLO DTOs Pydantic (schemas/stock.py), nunca
    objetos ORM SQLModel directamente.
  - `user_uuid` (auditoría) se resuelve del token Bearer de TinyDB en el
    servidor; NUNCA se acepta del cliente. Sin FK a nivel SQL.
  - Reglas de negocio (cálculo/protección de stock) en services/inventory.py.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from database import get_db
from routes.auth import _resolve_user
from schemas.stock import (
    ItemCreate,
    ItemEntryCreate,
    ItemEntryResponse,
    ItemExitCreate,
    ItemExitResponse,
    ItemResponse,
    ItemUpdate,
    OrderListResponse,
    StockViewResponse,
    WarehouseResponse,
)
from services import inventory

inventory_router = APIRouter(prefix="/inventory", tags=["Inventory"])


def _user_uuid_from_tinydb(user: dict) -> str:
    """Deriva el user_uuid auditado del usuario autenticado en TinyDB.

    TinyDB identifica usuarios por doc_id entero; se expone como string
    estable `tinydb:<id>` para las columnas de auditoría user_uuid.
    """
    user_id = user.get("id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Usuario sin identificador")
    return f"tinydb:{user_id}"


# ═══════════════════════════════════════════════════════════
# Almacenes
# ═══════════════════════════════════════════════════════════


@inventory_router.get("/warehouses", response_model=list[WarehouseResponse])
def list_warehouses(db: Session = Depends(get_db)):
    """Lista los almacenes operativos (Los Ángeles / Zaragoza)."""
    return inventory.list_warehouses(db)


# ═══════════════════════════════════════════════════════════
# Productos (Item)
# ═══════════════════════════════════════════════════════════


@inventory_router.post("/products", response_model=ItemResponse, status_code=201)
def create_item(
    payload: ItemCreate,
    user: dict = Depends(_resolve_user),
    db: Session = Depends(get_db),
):
    """Crea un producto (SKU). Requiere auth. El stock inicial es 0 (derivado)."""
    return inventory.create_item(db, payload)


@inventory_router.get("/products", response_model=list[ItemResponse])
def list_items(
    warehouse_id: int | None = Query(
        default=None,
        description="Acota current_stock a un almacén (partición) concreto",
    ),
    db: Session = Depends(get_db),
):
    """Lista productos con `current_stock` calculado (alcance global o por almacén)."""
    return inventory.list_items(db, warehouse_id)


@inventory_router.get("/products/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    """Detalle de un producto con `current_stock` calculado (alcance global)."""
    item = inventory.get_item_or_404(db, item_id)
    return inventory.item_to_response(db, item)


@inventory_router.patch("/products/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int, payload: ItemUpdate, db: Session = Depends(get_db)
):
    """Actualiza metadatos del producto — nunca el stock (inmutabilidad)."""
    return inventory.update_item(db, item_id, payload)


@inventory_router.get(
    "/stock/{item_id}",
    response_model=StockViewResponse,
)
def get_stock(
    item_id: int,
    warehouse_id: int | None = Query(
        default=None,
        description="Partición por almacén; omite para alcance global",
    ),
    db: Session = Depends(get_db),
):
    """Stock calculado en tiempo de ejecución: SUM(entradas) - SUM(salidas)."""
    return inventory.get_stock_view(db, item_id, warehouse_id)


@inventory_router.get("/orders", response_model=OrderListResponse)
def list_orders(
    item_id: int | None = Query(
        default=None, description="Filtra órdenes por producto"
    ),
    warehouse_id: int | None = Query(
        default=None, description="Filtra órdenes por almacén (partición)"
    ),
    db: Session = Depends(get_db),
):
    """Lista todas las órdenes (inbound + outbound) por fecha descendente."""
    return inventory.list_orders(db, item_id, warehouse_id)


# ═══════════════════════════════════════════════════════════
# Órdenes de entrada/salida (requieren Bearer token TinyDB → user_uuid)
# ═══════════════════════════════════════════════════════════


@inventory_router.post(
    "/orders/inbound", response_model=ItemEntryResponse, status_code=201
)
def create_inbound_order(
    payload: ItemEntryCreate,
    user: dict = Depends(_resolve_user),
    db: Session = Depends(get_db),
):
    """Registra una orden de entrada de stock. `user_uuid` se estampa desde el token."""
    user_uuid = _user_uuid_from_tinydb(user)
    return inventory.create_inbound_order(db, payload, user_uuid)


@inventory_router.post(
    "/orders/outbound", response_model=ItemExitResponse, status_code=201
)
def create_outbound_order(
    payload: ItemExitCreate,
    user: dict = Depends(_resolve_user),
    db: Session = Depends(get_db),
):
    """Registra una orden de salida validando disponibilidad (HTTP 400 si excede)."""
    user_uuid = _user_uuid_from_tinydb(user)
    return inventory.create_outbound_order(db, payload, user_uuid)
