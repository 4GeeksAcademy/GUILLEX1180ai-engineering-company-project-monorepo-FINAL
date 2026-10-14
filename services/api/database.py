"""Capa de acceso a datos de la API TrackFlow.

Combina:
- TinyDB (JSON local) para Suppliers / Incidents (legado).
- SQLModel + SQLAlchemy sobre PostgreSQL (Supabase) para los nuevos modelos.

Variables de entorno requeridas (archivo `.env` en la raíz del repo):
- DATABASE_URL: URL de conexión a PostgreSQL (p. ej. Supabase).
"""

import os
from pathlib import Path
from typing import Generator

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine
from tinydb import Query, TinyDB

# ─── Entorno ───

def _load_dotenv_hierarchy() -> None:
    """Carga `.env` encadenando desde este directorio hacia la raíz del repo.

    Permite combinar `services/api/.env` (claves del servicio) con el `.env`
    raíz (p. ej. DATABASE_URL) sin sobreescribir variables ya definidas.
    """
    current = Path(__file__).resolve().parent
    for directory in [current, *current.parents]:
        env_file = directory / ".env"
        if env_file.is_file():
            load_dotenv(env_file, override=False)


_load_dotenv_hierarchy()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL no está definida. Configúrala en el archivo .env "
        "(p. ej. DATABASE_URL=postgresql://user:password@host:5432/dbname) "
        "o en las variables de entorno del proceso."
    )

# Compatibilidad con URLs en formato antiguo "postgres://" (algunos proveedores).
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ─── TinyDB (JSON local — módulos Suppliers / Incidents) ───

# Cliente TinyDB genérico (ruta configurable vía TINYDB_DB_PATH).
TINYDB_DB_PATH = os.getenv("TINYDB_DB_PATH", "db.json")
tinydb_client = TinyDB(TINYDB_DB_PATH)

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

# ─── Motor SQLModel / PostgreSQL ───

# echo (SQL_ECHO=true) emite el SQL generado en logs — SOLO para desarrollo;
# en producción dejar apagado (ruido y rendimiento).
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
)


def init_db() -> None:
    """Crea las tablas definidas con @SQLModel.metadata en la base de datos.

    ⚠️  ADVERTENCIA: `create_all()` solo crea tablas que NO existen; nunca
    aplica cambios sobre tablas existentes (ALTER, renombrados, índices).
    Es adecuado para entornos de desarrollo/aprendizaje y prototipado.
    En producción debe reemplazarse por un sistema de migraciones versionado
    como Alembic (SQLModel soporta Alembic de forma nativa).
    """
    SQLModel.metadata.create_all(engine)


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: devuelve una sesión SQLModel por petición.

    Se crea y cierra una sesión nueva en cada petición (sin sesiones globales).
    """
    with Session(engine) as session:
        yield session