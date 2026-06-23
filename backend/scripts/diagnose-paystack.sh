#!/usr/bin/env bash
set -euo pipefail

if [ -z "${PAYSTACK_SECRET_KEY:-}" ]; then
  echo "Set PAYSTACK_SECRET_KEY before running this script."
  exit 1
fi

PLAN_CODE="${1:-${PAYSTACK_STARTER_PLAN:-PLN_g4lj8z24z5jugso}}"
EMAIL="${2:-billing-diagnose@mailthur.com}"
CALLBACK_URL="${3:-https://staging.mailthur.com/dashboard/billing?payment=success}"

echo "=== Paystack diagnose ==="
echo "Plan: $PLAN_CODE"
echo "Email: $EMAIL"
echo

echo "--- GET /plan/$PLAN_CODE ---"
PLAN_RESP=$(curl -sS -w "\n__HTTP__%{http_code}" \
  -H "Authorization: Bearer $PAYSTACK_SECRET_KEY" \
  "https://api.paystack.co/plan/$PLAN_CODE")
PLAN_HTTP=$(echo "$PLAN_RESP" | sed -n 's/.*__HTTP__//p')
PLAN_BODY=$(echo "$PLAN_RESP" | sed 's/__HTTP__.*//')
echo "HTTP: $PLAN_HTTP"
echo "$PLAN_BODY" | python3 -m json.tool 2>/dev/null || echo "$PLAN_BODY"
echo

AMOUNT=$(printf '%s' "$PLAN_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('amount',''))" 2>/dev/null || true)

INIT_PAYLOAD=$(python3 - <<PY
import json
payload = {
  "email": "$EMAIL",
  "plan": "$PLAN_CODE",
  "callback_url": "$CALLBACK_URL",
  "metadata": {"product": "mailthur", "plan": "starter", "user_email": "$EMAIL"},
}
amount = "$AMOUNT".strip()
if amount.isdigit():
  payload["amount"] = int(amount)
print(json.dumps(payload))
PY
)

echo "--- POST /transaction/initialize ---"
INIT_RESP=$(curl -sS -w "\n__HTTP__%{http_code}" -X POST "https://api.paystack.co/transaction/initialize" \
  -H "Authorization: Bearer $PAYSTACK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d "$INIT_PAYLOAD")
INIT_HTTP=$(echo "$INIT_RESP" | sed -n 's/.*__HTTP__//p')
INIT_BODY=$(echo "$INIT_RESP" | sed 's/__HTTP__.*//')
echo "HTTP: $INIT_HTTP"
echo "$INIT_BODY" | python3 -m json.tool 2>/dev/null || echo "$INIT_BODY"
