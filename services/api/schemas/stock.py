"""DTOs del dominio de Stock (Inventario) — Separados de los modelos ORM.

⚠️  Estos esquemas viven en el paquete `schemas/` (no en un archivo
`schemas.py`) porque en Python un módulo `schemas.py` quedaría sombreado
por el paquete `schemas/` homónimo y sería inimportable.

Capa de DTOs (Pydantic BaseModel) — pura serialización/validación HTTP:
  - Requests:  qué acepta la API (validación de entrada).
  - Responses: qué expone la API (nunca se usan como input).
Los modelos ORM (`table=True`) permanecen EXCLUSIVAMENTE en `models.py`.

Relación con el ORM:
  Product       ↔ ItemCreate / ItemUpdate / ItemResponse
  InboundOrder  ↔ ItemEntryCreate / ItemEntryResponse
  OutboundOrder ↔ ItemExitCreate / ItemExitResponse
  Warehouse     ↔ WarehouseResponse
  (listado)     ↔ OrderResponse / OrderListResponse (GET /orders)

Nota: `ItemResponse.current_stock` es un campo CALCULADO (entradas - salidas),
NO está almacenado en la tabla `products`; el endpoint lo puebla antes de
responder (ver `services/inventory.py::item_to_response`).
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ═══════════════════════════════════════════════════════════
# Producto / SKU (ORM: models.Product)
# ═══════════════════════════════════════════════════════════


class ItemCreate(BaseModel):
    """DTO de creación de producto."""

    name: str = Field(min_length=1, max_length=200, description="Nombre comercial")
    sku: str = Field(min_length=1, max_length=64, description="SKU único")
    description: str | None = Field(default=None, max_length=1000)
    category: str | None = Field(
        default=None,
        description="Moda / Electrónica / Cosmética / Alimentación / Otro",
    )
    unit: str | None = Field(
        default=None,
        max_length=32,
        description="Unidad de medida (unidad, caja, kg, litro...)",
    )
    is_active: bool = Field(default=True, description="Activo en catálogo")


class ItemUpdate(BaseModel):
    """DTO de actualización de producto (parcial: solo campos enviados)."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    sku: str | None = Field(default=None, min_length=1, max_length=64)
    description: str | None = Field(default=None, max_length=1000)
    category: str | None = Field(default=None)
    unit: str | None = Field(default=None, max_length=32)
    is_active: bool | None = None


class ItemResponse(BaseModel):
    """DTO de respuesta de producto.

    `current_stock` es un campo CALCULADO por el endpoint
    (SUM(entradas) - SUM(salidas)) y no existe en la tabla `products`.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    description: str | None = None
    category: str | None = None
    unit: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Campo calculado — el ORM no lo tiene; lo puebla el endpoint.
    current_stock: float = 0.0


# ═══════════════════════════════════════════════════════════
# Entrada de stock (ORM: models.InboundOrder)
# ═══════════════════════════════════════════════════════════


class ItemEntryCreate(BaseModel):
    """DTO de registro de entrada de stock (recepción)."""

    item_id: int = Field(description="FK al producto (Item)")
    warehouse_id: int = Field(
        description="Almacén destino — clave de partición del stock"
    )
    quantity: float = Field(gt=0, description="Cantidad recibida (> 0)")
    notes: str | None = Field(
        default=None, max_length=1000, description="Notas / referencia albarán"
    )


class ItemEntryResponse(BaseModel):
    """DTO de respuesta de entrada de stock.

    `user_uuid` es AUDITORÍA: lo estampa el servidor desde el token TinyDB
    (nunca se acepta del cliente).
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    warehouse_id: int
    quantity: float
    user_uuid: str
    notes: str | None = None
    created_at: datetime


# ═══════════════════════════════════════════════════════════
# Salida de stock (ORM: models.OutboundOrder)
# ═══════════════════════════════════════════════════════════


class ItemExitCreate(BaseModel):
    """DTO de registro de salida de stock (envío / consumo)."""

    item_id: int = Field(description="FK al producto (Item)")
    warehouse_id: int = Field(
        description="Almacén origen — clave de partición del stock"
    )
    quantity: float = Field(gt=0, description="Cantidad salida (> 0)")
    reason: str | None = Field(
        default=None,
        max_length=500,
        description="Motivo o justificación de la salida",
    )
    destination: str | None = Field(
        default=None, max_length=200, description="Destino (sucursal, cliente...)"
    )


class ItemExitResponse(BaseModel):
    """DTO de respuesta de salida de stock.

    `user_uuid` es AUDITORÍA: lo estampa el servidor desde el token TinyDB.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    warehouse_id: int
    quantity: float
    user_uuid: str
    reason: str | None = None
    destination: str | None = None
    created_at: datetime


# ═══════════════════════════════════════════════════════
# Almacén (ORM: models.Warehouse)
# ═══════════════════════════════════════════════════════


class WarehouseResponse(BaseModel):
    """DTO de respuesta de almacén (CONTEXT.es.md: LA y Zaragoza)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    city: str
    country: str
    is_active: bool


class StockViewResponse(BaseModel):
    """DTO de stock calculado en tiempo de ejecución (nunca persistido).

    `current_stock = SUM(entradas) - SUM(salidas)` acotado al alcance
    (warehouse_id) indicado; si es None, alcance global.
    """

    item_id: int
    warehouse_id: int | None = None
    current_stock: float


# ═══════════════════════════════════════════════════════════
# Listado de órdenes (GET /orders) — unifica entradas y salidas
# ═══════════════════════════════════════════════════════════


class OrderResponse(BaseModel):
    """DTO de orden unificada (entrada o salida) para GET /inventory/orders.

    `type` distingue el origen: "inbound" (InboundOrder) u
    "outbound" (OutboundOrder). `notes` aplica a inbound;
    `reason`/`destination` a outbound.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    type: Literal["inbound", "outbound"]
    item_id: int
    warehouse_id: int
    quantity: float
    user_uuid: str
    notes: str | None = None
    reason: str | None = None
    destination: str | None = None
    created_at: datetime


class OrderListResponse(BaseModel):
    """DTO de respuesta del listado de órdenes (orden cronológico desc)."""

    orders: list[OrderResponse]
    total: int
