# `services` — Backend Services

This folder contains **all the backend services** (APIs and background workers) for TrackFlow Tech.

## Structure

```
services/
├── README.md                          # This file
├── README.es.md                       # Spanish version
└── tracker-api/                       # Central FastAPI service
    ├── requirements.txt               # Python dependencies
    ├── .env.example                   # Environment variables template
    └── app/
        ├── __init__.py
        ├── main.py                    # FastAPI app entry point
        ├── core/
        │   ├── __init__.py
        │   └── config.py             # Pydantic Settings
        ├── models/
        │   ├── __init__.py
        │   └── lead.py               # Lead model
        │   └── candidate.py          # Candidate model
        └── routers/
            ├── __init__.py
            ├── leads.py              # /api/v1/leads endpoints
            └── candidates.py         # /api/v1/candidates endpoints
```

## Services

| Service | Description | Status |
|---------|-------------|--------|
| `tracker-api` | Centralized FastAPI for TrackFlow ecosystem | 🟡 Scaffold |

## How to run

```bash
cd services/tracker-api
pip install -r requirements.txt
uvicorn app.main:app --reload
```
