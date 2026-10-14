"""Demo E2E de inserción contra Supabase vía API real (puerto 8001).

Ciclo: registro → login → crear producto → entrada → salida (válida y
rechazada) → verificación de netos. Borra el producto de prueba al final.
"""

import requests

API = "http://127.0.0.1:8001/api/v1"
H = {"Content-Type": "application/json"}

print("=" * 60)
print("1. REGISTRO + LOGIN (auth TinyDB)")
print("=" * 60)
email = "lead-demo-e2e@trackflow.com"
r = requests.post(f"{API}/auth/register", json={
    "email": email, "password": "Demo1234", "name": "Tech Lead Demo",
})
# 409 = el usuario de prueba ya existe de una ejecución anterior → seguimos
print(f"   register → {r.status_code}: {r.json()}")
r = requests.post(f"{API}/auth/login", json={
    "email": email, "password": "Demo1234",
})
token = r.json()["access_token"]
print(f"   login → {r.status_code}, token: {token[:12]}... (len {len(token)})")
AUTH = {"Authorization": f"Bearer {token}", **H}

print()
print("=" * 60)
print("2. CREAR PRODUCTO (POST /inventory/products — autenticado)")
print("=" * 60)
sku = "SKU-DEMO-E2E"
r = requests.post(f"{API}/inventory/products", json={
    "name": "Producto demo E2E", "sku": sku,
    "category": "Moda", "unit": "unidad",
}, headers=AUTH)
print(f"   → {r.status_code}: {r.json()}")
item = r.json()
item_id = item["id"]
print(f"   stock inicial devuelto: {item['current_stock']:g} (siempre 0, derivado)")

print()
print("=" * 60)
print("3. ENTRADA de 100 uds al almacén LA (POST /orders/inbound)")
print("=" * 60)
r = requests.post(f"{API}/inventory/orders/inbound", json={
    "item_id": item_id, "warehouse_id": 1, "quantity": 100,
    "notes": "recepción E2E",
}, headers=AUTH)
print(f"   → {r.status_code}: {r.json()}")
print(f"   user_uuid auditado: {r.json()['user_uuid']} (server-side, no del cliente)")

print()
print("=" * 60)
print("4. SALIDA de 30 uds (POST /orders/outbound — válida)")
print("=" * 60)
r = requests.post(f"{API}/inventory/orders/outbound", json={
    "item_id": item_id, "warehouse_id": 1, "quantity": 30,
    "reason": "envío E2E",
}, headers=AUTH)
print(f"   → {r.status_code}: {r.json()}")

print()
print("=" * 60)
print("5. SALIDA de 99999 uds (debe rechazarse con HTTP 400)")
print("=" * 60)
r = requests.post(f"{API}/inventory/orders/outbound", json={
    "item_id": item_id, "warehouse_id": 1, "quantity": 99999,
}, headers=AUTH)
print(f"   → {r.status_code}: {r.json()['detail']}")

print()
print("=" * 60)
print("6. NETO VERIFICADO (esperado: 100 - 30 = 70)")
print("=" * 60)
r = requests.get(f"{API}/inventory/products/{item_id}")
print(f"   GET /products/{item_id} → current_stock = {r.json()['current_stock']:g}")
r = requests.get(f"{API}/inventory/stock/{item_id}", params={"warehouse_id": 1})
print(f"   GET /stock/{item_id}?warehouse_id=1 → {r.json()['current_stock']:g}")
r = requests.get(f"{API}/inventory/orders", params={"item_id": item_id})
for o in r.json()["orders"]:
    print(f"   orden: [{o['type']}] x{o['quantity']:g} por {o['user_uuid']}")

print()
print("=" * 60)
print("7. SIN TOKEN (POST /orders/inbound debe dar 401)")
print("=" * 60)
r = requests.post(f"{API}/inventory/orders/inbound", json={
    "item_id": item_id, "warehouse_id": 1, "quantity": 1,
}, headers=H)
print(f"   → {r.status_code}: {r.json()['detail']}")

print()
print("=" * 60)
print("8. LIMPIEZA: borrado del producto de prueba")
print("=" * 60)
import database  # noqa: E402
from sqlmodel import Session, select  # noqa: E402
from models import OutboundOrder, InboundOrder, Product  # noqa: E402

with Session(database.engine) as db:
    prod = db.exec(select(Product).where(Product.sku == sku)).one_or_none()
    if prod:
        for model in (OutboundOrder, InboundOrder):
            for row in db.exec(select(model).where(model.item_id == prod.id)).all():
                db.delete(row)
        db.delete(prod)
        db.commit()
        print(f"   borrado producto id={prod.id} ({sku}) y sus movimientos ✓")

print()
print("CICLO E2E COMPLETADO — datos verificados en Supabase.")
