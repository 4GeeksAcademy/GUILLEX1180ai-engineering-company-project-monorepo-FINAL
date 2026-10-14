"""Modelos ORM (SQLModel) del módulo de inventario — PostgreSQL/Supabase.

Capa de persistencia EXCLUSIVA: solo modelos `table=True` que mapean las
tablas reales de la base de datos relacional (Supabase). Sin DTOs ni enums
de presentación — esos viven en `schemas/` (fuente única de verdad):

  - schemas/enums.py:   SupplierStatus, ProductCategory, Country,
                        IncidentCategory, IncidentStatus, IncidentOrigin.
  - schemas/auth.py, suppliers.py, incidents.py, leads.py, stock.py, common.py.

Reglas del dominio TrackFlow (CONTEXT.md / Documentos_Hitos12.md):
  - `current_stock` NUNCA es una columna: se deriva de
    SUM(inbound_orders) - SUM(outbound_orders).
  - `user_uuid` referencia al usuario TinyDB como string (sin FK relacional).
  - `warehouse_id` es la clave de partición del stock (US-LA / ES-ZAZ).
"""

from __future__ import annotations



# ═══════════════════════════════════════════════════════════
# Re-export desde schemas/ (los modelos definitivos)
# ═══════════════════════════════════════════════════════════

# Auth
from schemas.auth import (  # noqa: E402, F401
    RegisterPayload,
    LoginPayload,
    ProfileUpdatePayload,
    RegisterResponse,
    UserInfo,
    TokenResponse,
    AuthResponse,
    UserProfileResponse,
    # Contraseña — recuperación y cambio
    ForgotPasswordPayload,
    ResetPasswordPayload,
    ChangePasswordPayload,
    ForgotPasswordResponse,
    PasswordChangedResponse,
)

# Suppliers
from schemas.suppliers import (  # noqa: E402, F401
    SupplierCreate,
    SupplierUpdateRate,
    SupplierUpdateStatus,
    SupplierResponse,
    SupplierListItem,
    SupplierListResponse,
)

# Incidents
from schemas.incidents import (  # noqa: E402, F401
    IncidentCreate,
    IncidentUpdateStatus,
    IncidentResponse,
    IncidentListItem,
    IncidentSummaryResponse,
    ErrorDetailAnalisis,
    AnalisisResponse,
)

# Leads
from schemas.leads import (  # noqa: E402, F401
    LeadCreate,
    LeadUpdate,
    LeadPatch,
    LeadOut,
    LeadListItem,
    LeadListResponse,
    NotePost,
    NoteOut,
    NoteListResponse,
)

# Common
from schemas.common import (  # noqa: E402, F401
    HealthResponse,
    ErrorDetail,
)


# ═══════════════════════════════════════════════════════
# Modelos SQLModel — PostgreSQL (Supabase) vía database.engine
#
# Tablas reales en la base de datos relacional. Se persisten con la sesión
# que entrega la dependencia `get_db()` (ver database.py).
#
# NOTA: `user_uuid` referencia al usuario de TinyDB (JSON local) sin FK ni
# replicación de la tabla de usuarios — TinyDB no es una fuente relacional.
# ═══════════════════════════════════════════════════════

from datetime import datetime, timezone  # noqa: E402

from sqlalchemy import CheckConstraint  # noqa: E402
from sqlmodel import Field, SQLModel  # noqa: E402


def _utc_now() -> datetime:
    """Devuelve la fecha/hora actual en UTC (usada como default_factory)."""
    return datetime.now(timezone.utc)


class Product(SQLModel, table=True):
    """Producto / SKU gestionado en el almacén (entidad principal de stock).

    El stock NUNCA se almacena aquí: es derivado (SUM(entradas) - SUM(salidas)).
    """

    __tablename__ = "products"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, description="Nombre comercial del producto")
    sku: str = Field(
        unique=True,
        index=True,
        description="Código SKU único del producto",
    )
    description: str | None = Field(default=None, description="Descripción")
    category: str | None = Field(
        default=None,
        description="Categoría (Moda / Electrónica / Cosmética / Alimentación / Otro)",
    )
    unit: str | None = Field(
        default=None,
        max_length=32,
        description="Unidad de medida (unidad, caja, kg, litro...)",
    )
    is_active: bool = Field(default=True, description="Producto activo en catálogo")
    created_at: datetime = Field(default_factory=_utc_now)
    updated_at: datetime = Field(default_factory=_utc_now)


class Warehouse(SQLModel, table=True):
    """Almacén operativo de TrackFlow.

    CONTEXT.es.md define dos almacenes propios:
      - Los Ángeles (Estados Unidos)
      - Zaragoza (España)
    `warehouse_id` es la CLAVE DE PARTICIÓN del cálculo de stock.
    """

    __tablename__ = "warehouses"

    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(
        unique=True,
        index=True,
        max_length=16,
        description="Código estable del almacén (US-LA, ES-ZAZ)",
    )
    name: str = Field(description="Nombre del almacén")
    city: str = Field(description="Ciudad (Los Ángeles / Zaragoza)")
    country: str = Field(description="País (Estados Unidos / España)")
    is_active: bool = Field(default=True, description="Almacén operativo")
    created_at: datetime = Field(default_factory=_utc_now)


class InboundOrder(SQLModel, table=True):
    """Orden de entrada (recepción) de unidades de un producto en el almacén."""

    __tablename__ = "inbound_orders"
    # Los modelos table=True bypassean la validación Pydantic en __init__,
    # por lo que quantity > 0 se garantiza con CHECK a nivel de base de datos.
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_inbound_orders_quantity_positive"),
    )

    id: int | None = Field(default=None, primary_key=True)
    item_id: int = Field(
        foreign_key="products.id",
        index=True,
        description="FK al producto (Product)",
    )
    warehouse_id: int = Field(
        foreign_key="warehouses.id",
        index=True,
        description="FK al almacén — clave de partición del stock",
    )
    quantity: float = Field(gt=0, description="Cantidad recibida (> 0)")
    user_uuid: str = Field(
        index=True,
        description="UUID del usuario que registró la entrada (TinyDB, sin FK)",
    )
    notes: str | None = Field(default=None, description="Notas / referencia del albarán")
    created_at: datetime = Field(
        default_factory=_utc_now,
        description="Fecha/hora UTC de la entrada",
    )


class OutboundOrder(SQLModel, table=True):
    """Orden de salida (envío/consumo) de unidades de un producto."""

    __tablename__ = "outbound_orders"
    # Los modelos table=True bypassean la validación Pydantic en __init__,
    # por lo que quantity > 0 se garantiza con CHECK a nivel de base de datos.
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_outbound_orders_quantity_positive"),
    )

    id: int | None = Field(default=None, primary_key=True)
    item_id: int = Field(
        foreign_key="products.id",
        index=True,
        description="FK al producto (Product)",
    )
    warehouse_id: int = Field(
        foreign_key="warehouses.id",
        index=True,
        description="FK al almacén — clave de partición del stock",
    )
    quantity: float = Field(gt=0, description="Cantidad salida (> 0)")
    user_uuid: str = Field(
        index=True,
        description="UUID del usuario que registró la salida (TinyDB, sin FK)",
    )
    destination: str | None = Field(
        default=None,
        description="Destino de la salida (sucursal, cliente, devolución...)",
    )
    reason: str | None = Field(
        default=None,
        max_length=500,
        description="Motivo o justificación de la salida",
    )
    created_at: datetime = Field(
        default_factory=_utc_now,
        description="Fecha/hora UTC de la salida",
    )
