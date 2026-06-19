#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-https://staging-backend.mailthur.com}"
TEST_EMAIL="${TEST_EMAIL:-bamzonline01@gmail.com}"

echo "==> Session"
SESSION_RESP=$(curl -sf -X POST "$API_URL/auth/session" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")
TOKEN=$(echo "$SESSION_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AUTH="Authorization: Bearer $TOKEN"

echo "==> Health score"
curl -sf "$API_URL/api/dashboard/health-score" -H "$AUTH" | python3 -m json.tool

echo "==> Platform stats (public)"
curl -sf "$API_URL/api/stats/platform" | python3 -m json.tool

echo "==> Inbox eligibility"
curl -sf "$API_URL/api/billing/inbox-eligibility" -H "$AUTH" | python3 -m json.tool

INBOX_ID=$(curl -sf "$API_URL/api/inboxes" -H "$AUTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['inboxes'][0]['id'] if d.get('inboxes') else '')")

if [[ -n "$INBOX_ID" ]]; then
  echo "==> Inbox deliverability health"
  curl -sf "$API_URL/api/inboxes/$INBOX_ID/health" -H "$AUTH" | python3 -m json.tool
else
  echo "SKIP: no inbox for deliverability test"
fi

echo "==> Domain check (google.com)"
curl -sf -X POST "$API_URL/api/tools/domain-check" \
  -H "Content-Type: application/json" \
  -d '{"domain":"google.com"}' | python3 -m json.tool

echo "==> All conversion feature tests completed"
