"""Base de datos TinyDB para el módulo de Suppliers.

Almacena los proveedores en un archivo JSON local.
"""

from tinydb import TinyDB, Query

DB_PATH = "suppliers_db.json"

db = TinyDB(DB_PATH)
suppliers_table = db.table("suppliers")
SupplierQuery = Query()