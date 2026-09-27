"""Modelos Pydantic para Supplier e Incident — Alineados con CONTEXT.md de TrackFlow.

⚠️  Este archivo ahora re-exporta desde `schemas/` para mantener
    compatibilidad con imports existentes (incidents_db.py, routes, seed).
    Los modelos definitivos están en services/api/schemas/.

Suppliers:
  - Estados: activo, suspendido.
  - Categorías: Moda, Electrónica, Cosmética, Alimentación.
  - Países: Estados Unidos, España.

Incidents:
  - Categorías: Retraso en entrega, Producto dañado, Devolución incorrecta,
    Error de picking, Problema de inventario.
  - Estados: open, in_progress, resolved, discarded.
  - Orígenes: customer, branch, internal.
"""

from __future__ import annotations


# ═══════════════════════════════════════════════════════════
# Enums — re-exportados desde schemas/enums.py (fuente única de verdad)
# ═══════════════════════════════════════════════════════════

from schemas.enums import (  # noqa: F401
    SupplierStatus,
    ProductCategory,
    Country,
    IncidentCategory,
    IncidentStatus,
    IncidentOrigin,
)


# ═══════════════════════════════════════════════════════════
# Re-export desde schemas/ (los modelos definitivos)
# ═══════════════════════════════════════════════════════════

# Auth
from schemas.auth import (  # noqa: E402, F401
    RegisterPayload,
    LoginPayload,
    ProfileUpdatePayload,
    RegisterResponse,
    UserInfo,
    TokenResponse,
    AuthResponse,
    UserProfileResponse,
)

# Suppliers
from schemas.suppliers import (  # noqa: E402, F401
    SupplierCreate,
    SupplierUpdateRate,
    SupplierUpdateStatus,
    SupplierResponse,
    SupplierListItem,
    SupplierListResponse,
)

# Incidents
from schemas.incidents import (  # noqa: E402, F401
    IncidentCreate,
    IncidentUpdateStatus,
    IncidentResponse,
    IncidentListItem,
    IncidentSummaryResponse,
    ErrorDetailAnalisis,
    AnalisisResponse,
)

# Leads
from schemas.leads import (  # noqa: E402, F401
    LeadCreate,
    LeadUpdate,
    LeadPatch,
    LeadOut,
    LeadListItem,
    LeadListResponse,
    NotePost,
    NoteOut,
    NoteListResponse,
)

# Common
from schemas.common import (  # noqa: E402, F401
    HealthResponse,
    ErrorDetail,
)
