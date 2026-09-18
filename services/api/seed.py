"""Script de seed para cargar proveedores iniciales en TinyDB.

Idempotente: no duplica registros si ya existen.
Ejecutar con: uv run seed
"""

from datetime import datetime, timezone

from database import suppliers_table, SupplierQuery
from models import SupplierStatus


# ─── Datos iniciales alineados con CONTEXT.md ───
# Carriers mencionados explícitamente en el contexto de TrackFlow

INITIAL_SUPPLIERS = [
    {
        "nombre": "UPS",
        "pais": "Estados Unidos",
        "categorias": ["Electrónica", "Moda"],
        "tarifa": 12.50,
        "status": SupplierStatus.ACTIVO.value,
    },
    {
        "nombre": "FedEx",
        "pais": "Estados Unidos",
        "categorias": ["Electrónica", "Cosmética", "Alimentación"],
        "tarifa": 15.00,
        "status": SupplierStatus.ACTIVO.value,
    },
    {
        "nombre": "DHL",
        "pais": "Estados Unidos",
        "categorias": ["Moda", "Electrónica", "Cosmética", "Alimentación"],
        "tarifa": 18.75,
        "status": SupplierStatus.ACTIVO.value,
    },
    {
        "nombre": "DHL España",
        "pais": "España",
        "categorias": ["Moda", "Electrónica", "Cosmética", "Alimentación"],
        "tarifa": 9.99,
        "status": SupplierStatus.ACTIVO.value,
    },
    {
        "nombre": "MRW",
        "pais": "España",
        "categorias": ["Moda", "Electrónica"],
        "tarifa": 7.50,
        "status": SupplierStatus.ACTIVO.value,
    },
    {
        "nombre": "SEUR",
        "pais": "España",
        "categorias": ["Moda", "Cosmética", "Alimentación"],
        "tarifa": 8.25,
        "status": SupplierStatus.ACTIVO.value,
    },
    {
        "nombre": "Correos Express",
        "pais": "España",
        "categorias": ["Moda"],
        "tarifa": 5.99,
        "status": SupplierStatus.SUSPENDIDO.value,
    },
    {
        "nombre": "USPS",
        "pais": "Estados Unidos",
        "categorias": ["Cosmética", "Alimentación"],
        "tarifa": 6.75,
        "status": SupplierStatus.SUSPENDIDO.value,
    },
]


def seed():
    """Inserta los proveedores iniciales si no existen (idempotente)."""
    inserted = 0

    for supplier_data in INITIAL_SUPPLIERS:
        # Buscar por nombre para evitar duplicados
        existing = suppliers_table.get(SupplierQuery.nombre == supplier_data["nombre"])
        if existing is not None:
            continue

        now = datetime.now(timezone.utc).isoformat()
        supplier_data["updated_at"] = now
        suppliers_table.insert(supplier_data)
        inserted += 1

    print(f"✅ Seed completado. Se insertaron {inserted} proveedor(es) nuevo(s).")

    total = len(suppliers_table)
    print(f"📊 Total de proveedores en base de datos: {total}")


if __name__ == "__main__":
    seed()