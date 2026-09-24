#!/bin/sh
# =============================================================================
# TrackFlow — Script de inicio para interfaces (/uis)
# Arranca website en el puerto 3000 y backoffice en el puerto 3001
# en segundo plano, manteniendo el contenedor activo con `wait`.
# =============================================================================

set -e

echo "🚀 Iniciando TrackFlow interfaces..."
echo "   • website    → http://0.0.0.0:3000"
echo "   • backoffice → http://0.0.0.0:3001"

# ── website (estático, servido con `npx serve`) ──
echo "📦 Arrancando website en el puerto 3000..."
cd /app/website
npx serve -l 3000 &
PID_WEBSITE=$!

# ── backoffice (Next.js en modo desarrollo) ──
echo "📦 Arrancando backoffice en el puerto 3001..."
cd /app/backoffice
npm run dev &
PID_BACKOFFICE=$!

# ── Trap para apagado limpio ──
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill "$PID_WEBSITE" 2>/dev/null || true
    kill "$PID_BACKOFFICE" 2>/dev/null || true
    wait "$PID_WEBSITE" 2>/dev/null || true
    wait "$PID_BACKOFFICE" 2>/dev/null || true
    echo "✅ Servicios detenidos."
    exit 0
}
trap cleanup SIGTERM SIGINT

# ── Mantener el contenedor activo ──
echo "✅ Interfaces iniciadas correctamente. Esperando señales..."
wait