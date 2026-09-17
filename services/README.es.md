# `services` — Servicios Backend

Esta carpeta contiene **todos los servicios backend** (APIs y workers) de TrackFlow Tech.

## Estructura

```
services/
├── README.md
├── README.es.md
└── tracker-api/                       # Servicio FastAPI centralizado
    ├── requirements.txt
    ├── .env.example
    └── app/
        ├── __init__.py
        ├── main.py                    # Punto de entrada FastAPI
        ├── core/
        │   ├── __init__.py
        │   └── config.py             # Pydantic Settings
        ├── models/
        │   ├── __init__.py
        │   └── ...
        └── routers/
            ├── __init__.py
            └── ...
```

## Servicios

| Servicio | Descripción | Estado |
|----------|-------------|--------|
| `tracker-api` | FastAPI centralizado para el ecosistema TrackFlow | 🟡 Scaffold inicial |

## Cómo ejecutar

```bash
cd services/tracker-api
pip install -r requirements.txt
uvicorn app.main:app --reload
```

> _English version: [README.md](./README.md)._
