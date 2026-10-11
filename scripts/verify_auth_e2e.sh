#!/usr/bin/env bash
# =============================================================================
# verify_auth_e2e.sh — Verificación E2E del flujo de autenticación (TrackFlow)
# Ejecuta contra un backend DESPLEGADO (o local) todos los checks de API:
#   1. Health check
#   2. Registro de usuario único (evita rate limit)
#   3. Login + obtención de perfil (/auth/me)
#   4. forgot-password con email registrado → 200 (anti-enumeración)
#   5. forgot-password con email NO registrado → 200 (idéntico)
#   6. reset-password con token inválido → 400
#   7. reset-password con token válido (opcional, vía $RESET_TOKEN) + login nuevo
#   8. reset-password con token reutilizado → 400 (single-use)
#   9. change-password con contraseña actual incorrecta → 400
#  10. change-password correcto → 200 y login con la nueva contraseña
#
# USO:
#   API_BASE=https://tu-backend.onrender.com/api/v1 \
#   RESET_TOKEN=<token-del-email> \          # opcional: habilita el check 7-8
#   ./scripts/verify_auth_e2e.sh
#
# VARIABLES:
#   API_BASE       (obligatoria) URL base de la API, p.ej. https://x.onrender.com/api/v1
#   RESET_TOKEN    (opcional)    token JWT recibido por email para probar el reset real
#   RUN_RATE_LIMIT (opcional)    "1" → añade el check de rate limit (usa el email único)
#
# SALIDA: ✓/✗ por check + resumen final. Exit code 0 si todo pasa.
# =============================================================================
set -u

API_BASE="${API_BASE:-}"
RESET_TOKEN="${RESET_TOKEN:-}"
RUN_RATE_LIMIT="${RUN_RATE_LIMIT:-0}"

PASS=0; FAIL=0
green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }
check() { # check <descripcion> <condicion:0|1>
  if [ "$2" -eq 0 ]; then green "  ✓ $1"; PASS=$((PASS+1));
  else red "  ✗ $1"; FAIL=$((FAIL+1)); fi
}

if [ -z "$API_BASE" ]; then
  red "ERROR: define API_BASE, p.ej.:"
  echo "  API_BASE=https://tu-backend.onrender.com/api/v1 ./scripts/verify_auth_e2e.sh"
  exit 2
fi
API_BASE="${API_BASE%/}"

# Email único por ejecución → nunca dispara el rate limit por email compartido
RUN_ID="$(date +%s)"
EMAIL="e2e-${RUN_ID}@example.com"
EMAIL_GHOST="e2e-noexiste-${RUN_ID}@example.com"
PASS_A="E2ePassword!${RUN_ID}"
PASS_B="E2ePasswordNew!${RUN_ID}"

echo "════════════════════════════════════════════════════"
echo " Verificación E2E — API: $API_BASE"
echo " Usuario de prueba: $EMAIL"
echo "════════════════════════════════════════════════════"

# ── 1. Health check ────────────────────────────────────────────────
echo; echo "[1] Health check"
CODE=$(curl -s -o /tmp/e2e_health.json -w "%{http_code}" "$API_BASE/health")
check "GET /health → 200" "$([ "$CODE" = 200 ] && echo 0 || echo 1)"
[ "$CODE" = 200 ] && cat /tmp/e2e_health.json && echo

# ── 2. Registro ────────────────────────────────────────────────────
echo; echo "[2] Registro de usuario"
CODE=$(curl -s -o /tmp/e2e_register.json -w "%{http_code}" -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS_A\",\"name\":\"E2E Tester\"}")
check "POST /auth/register → 201" "$([ "$CODE" = 201 ] && echo 0 || echo 1)"

# ── 3. Login + perfil ──────────────────────────────────────────────
echo; echo "[3] Login y perfil"
CODE=$(curl -s -o /tmp/e2e_login.json -w "%{http_code}" -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS_A\"}")
check "POST /auth/login → 200" "$([ "$CODE" = 200 ] && echo 0 || echo 1)"
TOKEN=$(python3 -c "import json;print(json.load(open('/tmp/e2e_login.json')).get('token',''))" 2>/dev/null || echo "")
check "Token JWT recibido" "$([ -n "$TOKEN" ] && echo 0 || echo 1)"
CODE=$(curl -s -o /tmp/e2e_me.json -w "%{http_code}" "$API_BASE/auth/me" -H "Authorization: Bearer $TOKEN")
check "GET /auth/me → 200" "$([ "$CODE" = 200 ] && echo 0 || echo 1)"

# ── 4. forgot-password: email registrado ───────────────────────────
echo; echo "[4] forgot-password (email REGISTRADO)"
CODE=$(curl -s -o /tmp/e2e_forgot.json -w "%{http_code}" -X POST "$API_BASE/auth/forgot-password" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\"}")
check "POST /auth/forgot-password → 200 genérico" "$([ "$CODE" = 200 ] && echo 0 || echo 1)"

# ── 5. forgot-password: email NO registrado (misma respuesta) ──────
echo; echo "[5] forgot-password (email NO registrado — anti-enumeración)"
CODE=$(curl -s -o /tmp/e2e_forgot_ghost.json -w "%{http_code}" -X POST "$API_BASE/auth/forgot-password" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL_GHOST\"}")
check "POST /auth/forgot-password → 200 (sin filtrar existencia)" "$([ "$CODE" = 200 ] && echo 0 || echo 1)"
if diff -q /tmp/e2e_forgot.json /tmp/e2e_forgot_ghost.json >/dev/null 2>&1; then
  check "Respuesta idéntica a la del email registrado" 0
else
  check "Respuesta idéntica a la del email registrado" 1
fi

# ── 6. reset-password con token inválido ───────────────────────────
echo; echo "[6] reset-password con token INVÁLIDO"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"token-falsamente-firmado-$RUN_ID\",\"new_password\":\"$PASS_B\"}")
check "POST /auth/reset-password → 400 (token rechazado)" "$([ "$CODE" = 400 ] && echo 0 || echo 1)"

# ── 7-8. reset-password con token REAL (opcional) ──────────────────
if [ -n "$RESET_TOKEN" ]; then
  echo; echo "[7] reset-password con token VÁLIDO (recibido por email)"
  CODE=$(curl -s -o /tmp/e2e_reset.json -w "%{http_code}" -X POST "$API_BASE/auth/reset-password" \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$RESET_TOKEN\",\"new_password\":\"$PASS_B\"}")
  check "POST /auth/reset-password → 200" "$([ "$CODE" = 200 ] && echo 0 || echo 1)"

  echo; echo "[8] Reutilización del MISMO token (single-use)"
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/reset-password" \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$RESET_TOKEN\",\"new_password\":\"OtraPass999!\"}")
  check "Segundo uso del token → 400" "$([ "$CODE" = 400 ] && echo 0 || echo 1)"

  echo; echo "[8b] Login con la contraseña ANTIGUA (debe fallar)"
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS_A\"}")
  check "Login con contraseña antigua → 401" "$([ "$CODE" = 401 ] && echo 0 || echo 1)"

  echo; echo "[8c] Login con la contraseña NUEVA (debe funcionar)"
  CODE=$(curl -s -o /tmp/e2e_login2.json -w "%{http_code}" -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS_B\"}")
  check "Login con contraseña nueva → 200" "$([ "$CODE" = 200 ] && echo 0 || echo 1)"
  TOKEN=$(python3 -c "import json;print(json.load(open('/tmp/e2e_login2.json')).get('token',''))" 2>/dev/null || echo "")
else
  echo; echo "[7-8] OMITIDOS — pasa RESET_TOKEN=<token-del-email> para probar el reset real"
fi

# ── 9. change-password con contraseña actual incorrecta ────────────
echo; echo "[9] change-password con contraseña ACTUAL incorrecta"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/change-password" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"current_password\":\" contraseña-totalmente-mala \",\"new_password\":\"$PASS_B\"}")
check "POST /auth/change-password → 400 (contraseña actual incorrecta)" "$([ "$CODE" = 400 ] && echo 0 || echo 1)"

# ── 10. change-password correcto ───────────────────────────────────
echo; echo "[10] change-password CORRECTO"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/change-password" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"current_password\":\"$PASS_B\",\"new_password\":\"$PASS_A\"}")
check "POST /auth/change-password → 200" "$([ "$CODE" = 200 ] && echo 0 || echo 1)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS_A\"}")
check "Login con la contraseña tras change-password → 200" "$([ "$CODE" = 200 ] && echo 0 || echo 1)"

# ── (Opcional) Rate limit ──────────────────────────────────────────
if [ "$RUN_RATE_LIMIT" = "1" ]; then
  echo; echo "[11] Rate limit (4 peticiciones al mismo email → esperado 429 en la 4ª)"
  LAST=0
  for i in 1 2 3 4; do
    LAST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/forgot-password" \
      -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL_GHOST\"}")
  done
  check "4ª petición → 429 Too Many Requests" "$([ "$LAST" = 429 ] && echo 0 || echo 1)"
fi

# ── Resumen ────────────────────────────────────────────────────────
echo
echo "════════════════════════════════════════════════════"
echo " RESULTADO: $PASS correctos / $FAIL fallos"
echo "════════════════════════════════════════════════════"
[ "$FAIL" -eq 0 ] && green "✅ TODOS LOS CHECKS DE API PASAN" || red "❌ HAY FALLOS — revisa arriba"
exit "$FAIL"