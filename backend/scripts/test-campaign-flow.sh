#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-https://staging-backend.mailthur.com}"
TEST_EMAIL="${TEST_EMAIL:-mailthur01@gmail.com}"

echo "==> Health check"
curl -sf "$API_URL/health" | head -c 200
echo ""

echo "==> Establish session"
SESSION_RESP=$(curl -sf -X POST "$API_URL/auth/session" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")
TOKEN=$(echo "$SESSION_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AUTH="Authorization: Bearer $TOKEN"

echo "==> Create campaign"
CREATE_RESP=$(curl -sf -X POST "$API_URL/api/campaigns" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"name":"E2E Test Campaign"}')
CAMPAIGN_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['campaign']['id'])")
echo "Campaign ID: $CAMPAIGN_ID"

echo "==> Save two steps"
curl -sf -X PUT "$API_URL/api/campaigns/$CAMPAIGN_ID/steps" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"steps":[{"subject":"Hello {{first_name}}","body":"Hi from MailThur step 1","delay_days":0},{"subject":"Follow up","body":"Second step for {{business_name}}","delay_days":1}]}' > /dev/null

echo "==> Import CSV with valid + invalid rows"
CSV_FILE=$(mktemp)
cat > "$CSV_FILE" <<'EOF'
email,first_name,business_name,city
valid.test@example.com,Alice,Acme Corp,Denver
not-an-email,Bob,Bad Inc,Boulder
charlie@example.com,Charlie,Charlie LLC,Aurora
EOF

IMPORT_RESP=$(curl -sf -X POST "$API_URL/api/campaigns/$CAMPAIGN_ID/contacts/csv" \
  -H "$AUTH" \
  -F "file=@$CSV_FILE;type=text/csv")
echo "Import result: $IMPORT_RESP"
rm -f "$CSV_FILE"

echo "==> Launch campaign"
curl -sf -X POST "$API_URL/api/campaigns/$CAMPAIGN_ID/launch" \
  -H "$AUTH" > /dev/null

echo "==> Fetch campaign detail"
DETAIL=$(curl -sf "$API_URL/api/campaigns/$CAMPAIGN_ID" -H "$AUTH")
echo "$DETAIL" | python3 -m json.tool | head -40

echo "==> Trigger queue processor"
QUEUE_RESP=$(curl -sf -X POST "$API_URL/api/campaigns/queue/process" -H "$AUTH")
echo "Queue result: $QUEUE_RESP"

echo "==> Pause campaign"
curl -sf -X POST "$API_URL/api/campaigns/$CAMPAIGN_ID/pause" -H "$AUTH" > /dev/null

echo "==> Done"
