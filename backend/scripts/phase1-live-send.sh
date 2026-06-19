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

echo "==> Pause active campaigns"
curl -sf "$API_URL/api/campaigns" -H "$AUTH" | python3 -c "
import sys, json, subprocess
data = json.load(sys.stdin)
api = sys.argv[1]
token = sys.argv[2]
for c in data.get('campaigns', []):
    if c.get('status') == 'active':
        cid = c['id']
        print(f'Pausing {cid} ({c.get(\"name\")})')
        subprocess.run(['curl','-sf','-X','POST',f'{api}/api/campaigns/{cid}/pause','-H',f'Authorization: Bearer {token}'], check=True)
" "$API_URL" "$TOKEN"

echo "==> Create campaign"
CREATE_RESP=$(curl -sf -X POST "$API_URL/api/campaigns" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"name":"Gmail Live E2E v2"}')
CAMPAIGN_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['campaign']['id'])")
echo "Campaign ID: $CAMPAIGN_ID"

curl -sf -X PUT "$API_URL/api/campaigns/$CAMPAIGN_ID/steps" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"steps":[{"subject":"Hello {{first_name}}","body":"Hi from MailThur - Gmail API enabled","delay_days":0},{"subject":"Follow up","body":"Step 2 for {{business_name}}","delay_days":1}]}' > /dev/null

CSV_FILE=$(mktemp)
printf 'email,first_name,business_name,city\n%s,Don,MailThur,Staging\n' "$TEST_EMAIL" > "$CSV_FILE"
curl -sf -X POST "$API_URL/api/campaigns/$CAMPAIGN_ID/contacts/csv" \
  -H "$AUTH" \
  -F "file=@$CSV_FILE;type=text/csv" > /dev/null
rm -f "$CSV_FILE"

curl -sf -X POST "$API_URL/api/campaigns/$CAMPAIGN_ID/launch" -H "$AUTH" > /dev/null

echo "==> Queue process"
QUEUE_RESP=$(curl -sf -X POST "$API_URL/api/campaigns/queue/process" -H "$AUTH")
echo "$QUEUE_RESP" | python3 -m json.tool

echo "==> Send log"
curl -sf "$API_URL/api/campaigns/$CAMPAIGN_ID/send-log" -H "$AUTH" | python3 -m json.tool

echo "==> Contacts"
curl -sf "$API_URL/api/campaigns/$CAMPAIGN_ID/contacts" -H "$AUTH" | python3 -m json.tool

echo "CAMPAIGN_ID=$CAMPAIGN_ID"
