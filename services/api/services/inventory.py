"""Servicio de negocio de inventario (Supabase / SQLModel).

Responsabilidades (capa entre routers y ORM):
  - Cálculo dinámico de stock: current_stock = SUM(entradas) - SUM(salidas),
    acotado por warehouse_id (clave de partición definida en CONTEXT.es.md:
    almacenes Los Ángeles y Zaragoza). Si warehouse_id es None → alcance global.
  - Inmutabilidad: el stock NUNCA se almacena en `items` ni se modifica por
    ningún endpoint; solo se deriva de los registros de entradas/salidas.
  - Protección contra stock negativo: antes de registrar una salida se calcula
    el stock disponible del alcance; si la salida lo excede → HTTP 400.
  - Auditoría user_uuid: se estampa desde el usuario autenticado de TinyDB
    (resuelto por el token Bearer), sin FK a nivel SQL.

Las sesiones se inyectan por petición (Depends(get_db)); este módulo nunca
abre sesiones ni mantiene estado global.
"""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from models import InboundOrder, OutboundOrder, Product, Warehouse
from schemas.stock import (
    ItemEntryCreate,
    ItemEntryResponse,
    ItemExitCreate,
    ItemExitResponse,
    ItemResponse,
    ItemUpdate,
    OrderListResponse,
    OrderResponse,
    StockViewResponse,
    WarehouseResponse,
)


# ═══════════════════════════════════════════════════════════
# Cálculo de stock (derivado — nunca persistido)
# ═══════════════════════════════════════════════════════════


def get_current_stock(
    db: Session, item_id: int, warehouse_id: int | None = None
) -> float:
    """Stock actual = SUM(entradas) - SUM(salidas) en el alcance indicado.

    Args:
        db: Sesión inyectada por petición (get_db).
        item_id: Producto (Item).
        warehouse_id: Almacén (partición) o None para alcance global.
    """

    def _sum(table: type[InboundOrder] | type[OutboundOrder]) -> float:
        stmt = select(func.coalesce(func.sum(table.quantity), 0.0)).where(
            table.item_id == item_id
        )
        if warehouse_id is not None:
            stmt = stmt.where(table.warehouse_id == warehouse_id)
        return float(db.scalar(stmt))

    return _sum(InboundOrder) - _sum(OutboundOrder)


# ═══════════════════════════════════════════════════════════
# Almacenes
# ═══════════════════════════════════════════════════════════


def list_warehouses(db: Session) -> list[WarehouseResponse]:
    """Lista los almacenes operativos (CONTEXT.es.md: LA y Zaragoza)."""
    rows = db.exec(select(Warehouse).where(Warehouse.is_active == True)).all()  # noqa: E712
    return [WarehouseResponse.model_validate(w) for w in rows]


def _get_warehouse_or_404(db: Session, warehouse_id: int) -> Warehouse:
    warehouse = db.get(Warehouse, warehouse_id)
    if warehouse is None:
        raise HTTPException(status_code=404, detail="Almacén no encontrado")
    return warehouse


# ═══════════════════════════════════════════════════════════
# Productos (Item)
# ═══════════════════════════════════════════════════════════


def item_to_response(
    db: Session, item: Product, warehouse_id: int | None = None
) -> ItemResponse:
    """Mapea ORM Product → DTO ItemResponse con current_stock calculado."""
    return ItemResponse(
        **item.model_dump(),
        current_stock=get_current_stock(db, item.id, warehouse_id),
    )


def get_item_or_404(db: Session, item_id: int) -> Product:
    item = db.get(Product, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return item


def create_item(db: Session, payload) -> ItemResponse:
    """Crea un producto. El stock inicial SIEMPRE es 0 (derivado)."""
    item = Product(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_response(db, item)


def list_items(
    db: Session, warehouse_id: int | None = None
) -> list[ItemResponse]:
    """Lista productos con current_stock calculado SIN N+1.

    Estrategia (3 queries fijas, independientes del tamaño del catálogo):
      1. Agregado SUM(inbound) GROUP BY item_id (opcionalmente por almacén).
      2. Agregado SUM(outbound) GROUP BY item_id (idem).
      3. SELECT de productos → se puebla current_stock = in - out.
    Los productos sin movimientos quedan con stock 0.
    """

    def _agg(model: type[InboundOrder] | type[OutboundOrder]) -> dict[int, float]:
        stmt = select(
            model.item_id, func.coalesce(func.sum(model.quantity), 0.0)
        ).group_by(model.item_id)
        if warehouse_id is not None:
            stmt = stmt.where(model.warehouse_id == warehouse_id)
        return {rid: float(qty) for rid, qty in db.exec(stmt).all()}

    in_qty = _agg(InboundOrder)
    out_qty = _agg(OutboundOrder)
    items = db.exec(select(Product)).all()
    return [
        ItemResponse(
            **it.model_dump(),
            current_stock=in_qty.get(it.id, 0.0) - out_qty.get(it.id, 0.0),
        )
        for it in items
    ]


def update_item(db: Session, item_id: int, payload: ItemUpdate) -> ItemResponse:
    """Actualización parcial de metadatos del producto.

    Inmutabilidad: `ItemUpdate` no contiene campos de stock y `items` no
    tiene columna de stock, por lo que es imposible modificar stock aquí.
    """
    item = get_item_or_404(db, item_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item_to_response(db, item)


def get_stock_view(
    db: Session, item_id: int, warehouse_id: int | None = None
) -> StockViewResponse:
    """Vista de stock calculado para un producto (alcance global o por almacén)."""
    get_item_or_404(db, item_id)
    return StockViewResponse(
        item_id=item_id,
        warehouse_id=warehouse_id,
        current_stock=get_current_stock(db, item_id, warehouse_id),
    )


# ═══════════════════════════════════════════════════════════
# Órdenes de entrada de stock (inbound)
# ═══════════════════════════════════════════════════════════


def create_inbound_order(
    db: Session, payload: ItemEntryCreate, user_uuid: str
) -> ItemEntryResponse:
    """Registra una orden de entrada de stock (recepción) con auditoría."""
    get_item_or_404(db, payload.item_id)
    _get_warehouse_or_404(db, payload.warehouse_id)
    entry = InboundOrder(**payload.model_dump(), user_uuid=user_uuid)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return ItemEntryResponse.model_validate(entry)


# ═══════════════════════════════════════════════════════════
# Órdenes de salida de stock (outbound) — protección contra negativo
# ═══════════════════════════════════════════════════════════


def create_outbound_order(
    db: Session, payload: ItemExitCreate, user_uuid: str
) -> ItemExitResponse:
    """Registra una orden de salida validando disponibilidad previa.

    Regla de negocio:
      1. Bloquea la fila del producto (SELECT ... FOR UPDATE) para serializar
         salidas concurrentes sobre el mismo item y evitar stock negativo
         por condición de carrera check-then-write.
      2. Calcula current_stock disponible del alcance ANTES de escribir.
      3. Si quantity > disponible → HTTP 400 con mensaje descriptivo.
      4. Solo entonces persiste la salida (que reduce el stock derivado).
    """
    get_item_or_404(db, payload.item_id)
    _get_warehouse_or_404(db, payload.warehouse_id)

    # Lock de fila: la segunda petición concurrente espera aquí a que la
    # primera confirme y recalcula la disponibilidad con su movimiento incluido.
    db.exec(
        select(Product.id).where(Product.id == payload.item_id).with_for_update()
    ).one()

    available = get_current_stock(db, payload.item_id, payload.warehouse_id)
    if payload.quantity > available:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Stock insuficiente en el almacén {payload.warehouse_id}: "
                f"se solicitaron {payload.quantity:g} unidades pero hay "
                f"{available:g} disponibles."
            ),
        )

    exit_ = OutboundOrder(**payload.model_dump(), user_uuid=user_uuid)
    db.add(exit_)
    db.commit()
    db.refresh(exit_)
    return ItemExitResponse.model_validate(exit_)


# ═══════════════════════════════════════════════════════════
# Listado de órdenes (entradas + salidas unificadas)
# ═══════════════════════════════════════════════════════════


def list_orders(
    db: Session,
    item_id: int | None = None,
    warehouse_id: int | None = None,
) -> OrderListResponse:
    """Lista todas las órdenes (inbound + outbound) por fecha descendente.

    Filtros opcionales: item_id (producto) y warehouse_id (partición).
    """

    def _rows(model: type[InboundOrder] | type[OutboundOrder], order_type: str):
        stmt = select(model)
        if item_id is not None:
            stmt = stmt.where(model.item_id == item_id)
        if warehouse_id is not None:
            stmt = stmt.where(model.warehouse_id == warehouse_id)
        return [
            OrderResponse(
                id=row.id,
                type=order_type,  # type: ignore[arg-type]
                item_id=row.item_id,
                warehouse_id=row.warehouse_id,
                quantity=row.quantity,
                user_uuid=row.user_uuid,
                notes=getattr(row, "notes", None),
                reason=getattr(row, "reason", None),
                destination=getattr(row, "destination", None),
                created_at=row.created_at,
            )
            for row in db.exec(stmt).all()
        ]

    orders = _rows(InboundOrder, "inbound") + _rows(OutboundOrder, "outbound")
    orders.sort(key=lambda o: o.created_at, reverse=True)
    return OrderListResponse(orders=orders, total=len(orders))
