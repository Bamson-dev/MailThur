#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-https://staging-backend.mailthur.com}"
TEST_EMAIL="${TEST_EMAIL:-bamzonline01@gmail.com}"

echo "==> Session"
TOKEN=$(curl -sf -X POST "$API_URL/auth/session" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AUTH="Authorization: Bearer $TOKEN"

echo "==> LeadThur import test"
CID=$(curl -sf -X POST "$API_URL/api/campaigns" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"LeadThur Import Test"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['campaign']['id'])")

RESULT=$(curl -sf -X POST "$API_URL/api/campaigns/$CID/contacts/leadthur" \
  -H "Content-Type: application/json" -H "$AUTH" \
  -d '{
    "contacts": [
      {"business_name":"Acme Corp","email":"test-leadthur@example.com","phone":"555-0100","city":"Denver","website":"https://acme.example"},
      {"business_name":"No Email LLC","phone":"555-0200","city":"Boulder"},
      {"business_name":"Valid Co","email":"valid-leadthur@example.com","city":"Aurora"}
    ]
  }')
echo "$RESULT" | python3 -m json.tool

IMPORTED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('imported',0))")
SKIPPED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('skipped',0))")

if [ "$IMPORTED" != "2" ] || [ "$SKIPPED" != "1" ]; then
  echo "FAIL: expected imported=2 skipped=1"
  exit 1
fi
echo "PASS: LeadThur import"

echo "==> Campaign list filter"
curl -sf "$API_URL/api/campaigns?status=draft&search=LeadThur" -H "$AUTH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert len(d['campaigns'])>=1
print('PASS: filter/search')"
echo ""

echo "==> Done (unsubscribe test requires live send_log id on staging)"
