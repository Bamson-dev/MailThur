#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-https://staging-backend.mailthur.com}"
TEST_EMAIL="${TEST_EMAIL:-billing-test-$(date +%s)@mailthur.test}"

echo "=== MailThur billing tests against $API_URL ==="
echo "Test email: $TEST_EMAIL"
echo

pass=0
fail=0

check() {
  local name="$1"
  shift
  if "$@"; then
    echo "PASS: $name"
    pass=$((pass + 1))
  else
    echo "FAIL: $name"
    fail=$((fail + 1))
  fi
}

SESSION=$(curl -sf -X POST "$API_URL/auth/session" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

if [ -z "$SESSION" ]; then
  echo "FATAL: could not create session"
  exit 1
fi

AUTH="Authorization: Bearer $SESSION"

echo "--- 1. Trial subscription auto-created via session ---"
STATUS=$(curl -sf "$API_URL/api/billing/status" -H "$AUTH")
echo "$STATUS" | python3 -m json.tool

check "status returns plan=trial" echo "$STATUS" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('plan')=='trial' else 1)"
check "trial_emails_sent is 0" echo "$STATUS" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('trial_emails_sent')==0 else 1)"
check "trial_emails_remaining is 500" echo "$STATUS" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('trial_emails_remaining')==500 else 1)"
check "trial_days_remaining >= 2" echo "$STATUS" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('trial_days_remaining',0)>=2 else 1)"

echo
echo "--- 2. Paystack checkout (starter) ---"
CHECKOUT=$(curl -sf -X POST "$API_URL/api/billing/checkout" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"plan":"starter"}' || echo '{"error":"checkout failed"}')
echo "$CHECKOUT" | python3 -m json.tool

check "checkout returns authorization_url" echo "$CHECKOUT" | python3 -c "import sys,json; d=json.load(sys.stdin); u=d.get('authorization_url',''); exit(0 if 'paystack.com' in u else 1)"

echo
echo "--- 3. Billing routes exist ---"
check "GET /api/billing/status is 200" test "$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/api/billing/status" -H "$AUTH")" = "200"
check "POST /webhooks/paystack/billing rejects unsigned" test "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API_URL/webhooks/paystack/billing" -H 'Content-Type: application/json' -d '{}')" = "401"

echo
echo "=== Results: $pass passed, $fail failed ==="
exit "$fail"
