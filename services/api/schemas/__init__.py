"""Schemas package — Modelos Pydantic separados por dominio.

Cada sub-módulo agrupa los esquemas de entrada (request), salida (response)
y listado (list_item) para un recurso de la API.

Principios:
  - Separación estricta input/output (nunca reusar response como input).
  - Esquemas de listado ligeros (menos campos que el detalle).
  - `model_config = {"from_attributes": True}` solo en esquemas de salida.
  - Cero exposición de `password`, `hashed_password` o datos sensibles.

Sub-módulos:
  - common:  Esquemas genéricos / compartidos (HealthResponse, ErrorDetail).
  - auth:    Autenticación y perfiles.
  - suppliers: Proveedores.
  - incidents: Incidencias (CRUD y análisis).
  - leads:   Leads / records y notas.
"""

from .common import *  # noqa: F401, F403
from .auth import *  # noqa: F401, F403
from .suppliers import *  # noqa: F401, F403
from .incidents import *  # noqa: F401, F403
from .leads import *  # noqa: F401, F403