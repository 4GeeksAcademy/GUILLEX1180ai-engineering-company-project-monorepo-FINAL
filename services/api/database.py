"""Base de datos TinyDB para los módulos de Suppliers e Incidents.

Almacena proveedores e incidencias en archivos JSON locales.
"""

from tinydb import TinyDB, Query

# ─── Suppliers ───

SUPPLIERS_DB_PATH = "suppliers_db.json"
suppliers_db = TinyDB(SUPPLIERS_DB_PATH)
suppliers_table = suppliers_db.table("suppliers")
SupplierQuery = Query()

# ─── Incidents ───

INCIDENTS_DB_PATH = "incidents_db.json"
incidents_db = TinyDB(INCIDENTS_DB_PATH)
incidents_table = incidents_db.table("incidents")
IncidentQuery = Query()