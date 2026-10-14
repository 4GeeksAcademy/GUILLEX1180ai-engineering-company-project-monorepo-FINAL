"""Datos semilla del módulo de inventario (Supabase / SQLModel).

Puebla la base de datos con los registros mínimos del dominio TrackFlow
(CONTEXT.es.md):
  - Dos almacenes propios: Los Ángeles (US) y Zaragoza (ES).
  - Productos de ejemplo en las categorías del negocio (Moda, Electrónica,
    Cosmética).
  - Entradas y salidas iniciales cuyo NETO debe coincidir exactamente con
    `current_stock` calculado por la API (SUM(entradas) - SUM(salidas)).

Uso:
    uv run python seed_inventory.py

Idempotente: re-ejecutar no duplica registros (warehouses por `code`,
productos por `sku`, movimientos por la marca `[seed]` en notes/reason).
"""

from __future__ import annotations

from sqlmodel import Session, select

import database
from models import InboundOrder, OutboundOrder, Product, Warehouse

SEED_MARK = "[seed]"  # marca para identificar movimientos sembrados


def seed_data() -> None:
    """Siembra warehouses, items, entradas y salidas mínimas (idempotente)."""
    with Session(database.engine) as db:
        # ─── Almacenes (CONTEXT.es.md: Los Ángeles y Zaragoza) ───
        wh_defs = [
            ("US-LA", "Almacén Los Ángeles", "Los Ángeles", "Estados Unidos"),
            ("ES-ZAZ", "Almacén Zaragoza", "Zaragoza", "España"),
        ]
        warehouses: dict[str, Warehouse] = {}
        for code, name, city, country in wh_defs:
            wh = db.exec(
                select(Warehouse).where(Warehouse.code == code)
            ).one_or_none()
            if wh is None:
                wh = Warehouse(code=code, name=name, city=city, country=country)
                db.add(wh)
                db.flush()
                print(f"[seed] Almacén creado: {code} ({city})")
            warehouses[code] = wh

        la, zaz = warehouses["US-LA"], warehouses["ES-ZAZ"]
        # IDs capturados en sesión viva (luego se usa en la verificación)
        la_id, zaz_id = la.id, zaz.id

        # ─── Productos (SKU) ───
        item_defs = [
            # (sku, name, category, unit)
            ("SKU-CAM-001", "Camiseta básica algodón", "Moda", "unidad"),
            ("SKU-AUR-001", "Auriculares inalámbricos Pro", "Electrónica", "unidad"),
            ("SKU-CRE-001", "Crema hidratante facial 50ml", "Cosmética", "unidad"),
        ]
        items: dict[str, Product] = {}
        for sku, name, category, unit in item_defs:
            item = db.exec(select(Product).where(Product.sku == sku)).one_or_none()
            if item is None:
                item = Product(name=name, sku=sku, category=category, unit=unit)
                db.add(item)
                db.flush()
                print(f"[seed] Producto creado: {sku} — {name}")
            items[sku] = item

        # ─── Entradas y salidas iniciales ───
        # (sku, warehouse, qty, notes)
        entry_defs = [
            ("SKU-CAM-001", la, 100.0, f"{SEED_MARK} recepción inicial LA"),
            ("SKU-CAM-001", zaz, 60.0, f"{SEED_MARK} recepción inicial Zaragoza"),
            ("SKU-AUR-001", la, 80.0, f"{SEED_MARK} recepción inicial LA"),
            ("SKU-CRE-001", zaz, 120.0, f"{SEED_MARK} recepción inicial Zaragoza"),
        ]
        for sku, wh, qty, notes in entry_defs:
            exists = db.exec(
                select(InboundOrder)
                .where(InboundOrder.item_id == items[sku].id)
                .where(InboundOrder.warehouse_id == wh.id)
                .where(InboundOrder.notes == notes)
            ).first()
            if exists is None:
                db.add(
                    InboundOrder(
                        item_id=items[sku].id,
                        warehouse_id=wh.id,
                        quantity=qty,
                        user_uuid="seed",
                        notes=notes,
                    )
                )
                print(f"[seed] Entrada: {sku} +{qty:g} en {wh.code}")

        # (sku, warehouse, qty, reason)
        exit_defs = [
            ("SKU-CAM-001", la, 25.0, f"{SEED_MARK} pedidos semana 1"),
            ("SKU-AUR-001", la, 30.0, f"{SEED_MARK} pedidos semana 1"),
        ]
        for sku, wh, qty, reason in exit_defs:
            exists = db.exec(
                select(OutboundOrder)
                .where(OutboundOrder.item_id == items[sku].id)
                .where(OutboundOrder.warehouse_id == wh.id)
                .where(OutboundOrder.reason == reason)
            ).first()
            if exists is None:
                db.add(
                    OutboundOrder(
                        item_id=items[sku].id,
                        warehouse_id=wh.id,
                        quantity=qty,
                        user_uuid="seed",
                        reason=reason,
                    )
                )
                print(f"[seed] Salida:  {sku} -{qty:g} en {wh.code}")

        db.commit()

    # ─── Verificación del neto sembrado ───
    from services.inventory import get_current_stock

    with Session(database.engine) as db:
        print("\n[seed] Verificación de current_stock (neto):")
        expected = {
            ("SKU-CAM-001", None): 100 + 60 - 25,   # 135
            ("SKU-CAM-001", la_id): 100 - 25,        # 75
            ("SKU-AUR-001", None): 80 - 30,          # 50
            ("SKU-CRE-001", None): 120,              # 120
        }
        for (sku, wh_id), want in expected.items():
            item = db.exec(select(Product).where(Product.sku == sku)).one()
            got = get_current_stock(db, item.id, wh_id)
            scope = f"warehouse_id={wh_id}" if wh_id else "global"
            status = "OK" if abs(got - want) < 1e-9 else "FALLO"
            print(f"  [{status}] {sku} ({scope}): {got:g} — esperado {want:g}")
            assert abs(got - want) < 1e-9, f"{sku} {scope}: {got} != {want}"

    print("\n[seed] Datos sembrados y verificados correctamente.")


if __name__ == "__main__":
    seed_data()
