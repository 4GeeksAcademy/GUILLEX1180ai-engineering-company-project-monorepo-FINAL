"""Tests E2E del módulo de inventario (router /inventory + reglas de negocio).

Cubren los requisitos del hito:
  - Doble BD e inyección por petición (Depends(get_db) sobre SQLite temporal).
  - Separación de capas: los endpoints responden solo DTOs Pydantic.
  - current_stock calculado (SUM(entradas) - SUM(salidas)), partición por warehouse.
  - Órdenes con user_uuid auditado desde el token (nunca desde el cliente).
  - Outbound con stock insuficiente → HTTP 400 (sin tocar la BD).
  - Datos semilla idempotentes con neto verificado.
"""

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, select

import pytest

import database
import main
from models import Warehouse
from routes.auth import _resolve_user

API = "/api/v1/inventory"

# Usuario fake inyectado en sustitución de _resolve_user (TinyDB).
FAKE_USER = {"id": 42, "email": "e2e@trackflow.test", "name": "E2E Test"}


# ─── Fixtures del módulo (sobrescriben/complementan a los del conftest) ───


@pytest.fixture()
def client():
    """TestClient con BD SQL temporal limpia y sin overrides de auth."""
    with TestClient(main.app) as c:
        main.app.dependency_overrides.clear()
        # Aislamiento entre tests: recrea el esquema en el SQLite temporal.
        SQLModel.metadata.drop_all(database.engine)
        SQLModel.metadata.create_all(database.engine)
        yield c
        main.app.dependency_overrides.clear()


@pytest.fixture()
def auth_client(client):
    """Client con `_resolve_user` sustituido por un usuario fake (tinydb:42)."""
    main.app.dependency_overrides[_resolve_user] = lambda: FAKE_USER
    yield client
    main.app.dependency_overrides.clear()


@pytest.fixture()
def wh_ids(client):
    """Crea los dos almacenes del dominio y devuelve {code: id}."""
    with Session(database.engine) as s:
        ids: dict[str, int] = {}
        for code, name, city, country in [
            ("US-LA", "Almacén Los Ángeles", "Los Ángeles", "Estados Unidos"),
            ("ES-ZAZ", "Almacén Zaragoza", "Zaragoza", "España"),
        ]:
            wh = s.exec(select(Warehouse).where(Warehouse.code == code)).one_or_none()
            if wh is None:
                wh = Warehouse(code=code, name=name, city=city, country=country)
                s.add(wh)
                s.commit()
                s.refresh(wh)
            ids[code] = wh.id
        return ids


def _create_product(client, sku="SKU-TEST-001", name="Producto test", category="Moda"):
    r = client.post(
        f"{API}/products",
        json={"name": name, "sku": sku, "category": category, "unit": "unidad"},
    )
    assert r.status_code == 201, r.text
    return r.json()


def _inbound(client, item_id, warehouse_id, quantity, **extra):
    return client.post(
        f"{API}/orders/inbound",
        json={"item_id": item_id, "warehouse_id": warehouse_id, "quantity": quantity, **extra},
    )


def _outbound(client, item_id, warehouse_id, quantity, **extra):
    return client.post(
        f"{API}/orders/outbound",
        json={"item_id": item_id, "warehouse_id": warehouse_id, "quantity": quantity, **extra},
    )


# ═══════════════════════════════════════════════════════════
# Almacenes y productos
# ═══════════════════════════════════════════════════════════


def test_warehouses_del_dominio(client, wh_ids):
    r = client.get(f"{API}/warehouses")
    assert r.status_code == 200
    codes = {w["code"]: w["city"] for w in r.json()}
    assert codes == {"US-LA": "Los Ángeles", "ES-ZAZ": "Zaragoza"}


def test_create_product_requiere_auth(client, wh_ids):
    r = client.post(f"{API}/products", json={"name": "X", "sku": "SKU-X-001"})
    assert r.status_code == 401


def test_create_product_stock_inicial_cero(auth_client, wh_ids):
    p = _create_product(auth_client)
    assert p["sku"] == "SKU-TEST-001"
    assert p["current_stock"] == 0.0
    # Nunca se expone un campo de stock persistido.
    assert "quantity" not in p


def test_list_products_neto_global_y_particion(auth_client, wh_ids):
    la, zaz = wh_ids["US-LA"], wh_ids["ES-ZAZ"]
    p = _create_product(auth_client)
    assert _inbound(auth_client, p["id"], la, 100).status_code == 201
    assert _inbound(auth_client, p["id"], zaz, 60).status_code == 201
    assert _outbound(auth_client, p["id"], la, 25, reason="pedidos").status_code == 201

    # Neto global: 100 + 60 - 25 = 135
    r = auth_client.get(f"{API}/products").json()
    assert r[0]["current_stock"] == 135.0
    # Partición por almacén (clave definida en CONTEXT.es.md)
    r = auth_client.get(f"{API}/products", params={"warehouse_id": la}).json()
    assert r[0]["current_stock"] == 75.0
    r = auth_client.get(f"{API}/products", params={"warehouse_id": zaz}).json()
    assert r[0]["current_stock"] == 60.0


def test_get_product_detalle_y_404(auth_client, wh_ids):
    p = _create_product(auth_client)
    r = auth_client.get(f"{API}/products/{p['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == p["id"]
    assert auth_client.get(f"{API}/products/999999").status_code == 404


def test_stock_endpoint_particionado(auth_client, wh_ids):
    la = wh_ids["US-LA"]
    p = _create_product(auth_client)
    _inbound(auth_client, p["id"], la, 10)
    _outbound(auth_client, p["id"], la, 3, reason="envío")
    r = auth_client.get(f"{API}/stock/{p['id']}", params={"warehouse_id": la})
    assert r.status_code == 200
    assert r.json()["current_stock"] == 7.0
    assert auth_client.get(f"{API}/stock/999999").status_code == 404


def test_patch_product_inmutable(auth_client, wh_ids):
    la = wh_ids["US-LA"]
    p = _create_product(auth_client)
    _inbound(auth_client, p["id"], la, 5)
    # Intento (y rechazo silencioso) de inyectar campos de stock en el PATCH.
    r = auth_client.patch(
        f"{API}/products/{p['id']}", json={"name": "Renombrado", "current_stock": 9999}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Renombrado"
    assert body["current_stock"] == 5.0  # sigue calculado, no persistido


# ═══════════════════════════════════════════════════════════
# Órdenes: auth, auditoría y protección de stock
# ═══════════════════════════════════════════════════════════


def test_orders_requieren_auth(client, wh_ids):
    assert client.post(f"{API}/orders/inbound", json={"item_id": 1, "warehouse_id": 1, "quantity": 1}).status_code == 401
    assert client.post(f"{API}/orders/outbound", json={"item_id": 1, "warehouse_id": 1, "quantity": 1}).status_code == 401


def test_user_uuid_estampado_por_el_servidor(auth_client, wh_ids):
    p = _create_product(auth_client)
    r = _inbound(auth_client, p["id"], wh_ids["US-LA"], 5, user_uuid="hackeado")
    assert r.status_code == 201, r.text
    # El user_uuid del cliente se descarta (DTO no lo contempla) y prevalece el token.
    assert r.json()["user_uuid"] == f"tinydb:{FAKE_USER['id']}"


def test_outbound_excede_stock_devuelve_400(auth_client, wh_ids):
    la = wh_ids["US-LA"]
    p = _create_product(auth_client)
    _inbound(auth_client, p["id"], la, 10)

    r = _outbound(auth_client, p["id"], la, 11, reason="exceso")
    assert r.status_code == 400
    assert "Stock insuficiente" in r.json()["detail"]

    # La BD no se tocó: el stock sigue en 10.
    r = auth_client.get(f"{API}/stock/{p['id']}", params={"warehouse_id": la})
    assert r.json()["current_stock"] == 10.0


def test_order_quantity_no_positiva_devuelve_422(auth_client, wh_ids):
    p = _create_product(auth_client)
    r = _inbound(auth_client, p["id"], wh_ids["US-LA"], 0)
    assert r.status_code == 422


def test_orders_404_item_o_almacen(auth_client, wh_ids):
    p = _create_product(auth_client)
    assert _inbound(auth_client, 999999, wh_ids["US-LA"], 1).status_code == 404
    assert _inbound(auth_client, p["id"], 999999, 1).status_code == 404


def test_list_orders_unificado_y_filtrado(auth_client, wh_ids):
    la, zaz = wh_ids["US-LA"], wh_ids["ES-ZAZ"]
    p = _create_product(auth_client)
    _inbound(auth_client, p["id"], la, 100)
    _inbound(auth_client, p["id"], zaz, 40)
    _outbound(auth_client, p["id"], la, 25, reason="pedidos semana 1")

    r = auth_client.get(f"{API}/orders")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 3
    types = {o["type"] for o in body["orders"]}
    assert types == {"inbound", "outbound"}
    # Todas las órdenes llevan auditoría.
    assert all(o["user_uuid"] == f"tinydb:{FAKE_USER['id']}" for o in body["orders"])

    # Filtros por partición (warehouse) y producto.
    r = auth_client.get(f"{API}/orders", params={"warehouse_id": zaz}).json()
    assert r["total"] == 1 and r["orders"][0]["type"] == "inbound"
    r = auth_client.get(f"{API}/orders", params={"item_id": p["id"]}).json()
    assert r["total"] == 3
    r = auth_client.get(f"{API}/orders", params={"item_id": 999999}).json()
    assert r["total"] == 0


def test_no_se_devuelven_objetos_orm(auth_client, wh_ids):
    """Los responses son JSON plano con claves exactas de los DTOs."""
    la = wh_ids["US-LA"]
    p = _create_product(auth_client)
    _inbound(auth_client, p["id"], la, 5)

    producto = auth_client.get(f"{API}/products/{p['id']}").json()
    assert set(producto) == {
        "id", "name", "sku", "description", "category", "unit",
        "is_active", "created_at", "updated_at", "current_stock",
    }
    orden = auth_client.get(f"{API}/orders").json()["orders"][0]
    assert set(orden) == {
        "id", "type", "item_id", "warehouse_id", "quantity",
        "user_uuid", "notes", "reason", "destination", "created_at",
    }


# ═══════════════════════════════════════════════════════════
# Datos semilla (idempotencia + neto verificado)
# ═══════════════════════════════════════════════════════════


def test_seed_data_idempotente_y_netos_verificados(client, wh_ids):
    from seed_inventory import seed_data

    seed_data()  # 1ª pasada
    seed_data()  # 2ª pasada — no debe duplicar nada

    productos = client.get(f"{API}/products").json()
    netos = {p["sku"]: p["current_stock"] for p in productos}
    assert netos == {
        "SKU-CAM-001": 135.0,   # 100 LA + 60 ZAZ - 25 LA
        "SKU-AUR-001": 50.0,    # 80 LA - 30 LA
        "SKU-CRE-001": 120.0,   # 120 ZAZ
    }

    # Partición verificada: Camiseta en Los Ángeles = 75.
    la = wh_ids["US-LA"]
    cam = next(p for p in productos if p["sku"] == "SKU-CAM-001")
    r = client.get(f"{API}/products/{cam['id']}")
    assert r.status_code == 200
    r = client.get(f"{API}/stock/{cam['id']}", params={"warehouse_id": la}).json()
    assert r["current_stock"] == 75.0
