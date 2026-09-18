"""Router CRUD para Suppliers.

Endpoints:
- POST /suppliers
- GET  /suppliers (con filtros por país y categoría)
- GET  /suppliers/{id}
- PATCH /suppliers/{id}/rate
- PATCH /suppliers/{id}/status
- DELETE /suppliers/{id}
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from database import suppliers_table
from models import (
    SupplierCreate,
    SupplierResponse,
    SupplierUpdateRate,
    SupplierUpdateStatus,
)

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


def _doc_to_response(doc) -> SupplierResponse:
    """Convierte un documento TinyDB a SupplierResponse."""
    return SupplierResponse(
        id=doc.doc_id,
        nombre=doc["nombre"],
        pais=doc["pais"],
        categorias=doc["categorias"],
        tarifa=doc["tarifa"],
        status=doc["status"],
        updated_at=doc["updated_at"],
    )


@router.post("", response_model=SupplierResponse, status_code=201)
async def create_supplier(payload: SupplierCreate):
    """Registra un proveedor nuevo. Devuelve 422 si falla validación."""
    now = datetime.now(timezone.utc).isoformat()
    doc_data = payload.model_dump()
    doc_data["updated_at"] = now
    # Convertir enums a strings para TinyDB
    doc_data["pais"] = payload.pais.value
    doc_data["categorias"] = [c.value for c in payload.categorias]
    doc_data["status"] = payload.status.value

    doc_id = suppliers_table.insert(doc_data)
    doc = suppliers_table.get(doc_id=doc_id)
    return _doc_to_response(doc)


@router.get("", response_model=list[SupplierResponse])
async def list_suppliers(
    pais: Optional[str] = Query(None, description="Filtrar por país (Ej: Estados Unidos)"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoría (Ej: Electrónica)"),
):
    """Lista proveedores con filtros opcionales por país y categoría."""
    all_docs = suppliers_table.all()
    results = []

    for doc in all_docs:
        if pais and doc["pais"].lower() != pais.lower():
            continue
        if categoria:
            cat_lower = categoria.lower()
            if not any(c.lower() == cat_lower for c in doc["categorias"]):
                continue
        results.append(_doc_to_response(doc))

    return results


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int):
    """Detalle de un proveedor por ID."""
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return _doc_to_response(doc)


@router.patch("/{supplier_id}/rate", response_model=SupplierResponse)
async def update_supplier_rate(supplier_id: int, payload: SupplierUpdateRate):
    """Actualiza la tarifa de un proveedor. Rechaza tarifas <= 0."""
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    now = datetime.now(timezone.utc).isoformat()
    suppliers_table.update(
        {"tarifa": payload.tarifa, "updated_at": now},
        doc_ids=[supplier_id],
    )
    updated = suppliers_table.get(doc_id=supplier_id)
    return _doc_to_response(updated)


@router.patch("/{supplier_id}/status", response_model=SupplierResponse)
async def update_supplier_status(supplier_id: int, payload: SupplierUpdateStatus):
    """Activa o suspende un proveedor. Valida contra los estados del contexto."""
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    now = datetime.now(timezone.utc).isoformat()
    suppliers_table.update(
        {"status": payload.status.value, "updated_at": now},
        doc_ids=[supplier_id],
    )
    updated = suppliers_table.get(doc_id=supplier_id)
    return _doc_to_response(updated)


@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier(supplier_id: int):
    """Elimina un proveedor por ID."""
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    suppliers_table.remove(doc_ids=[supplier_id])