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

echo "==> Billing status"
curl -sf "$API_URL/api/billing/status" -H "$AUTH" | python3 -m json.tool

echo "==> Billing checkout (starter, test mode URL)"
CHECKOUT=$(curl -sf -X POST "$API_URL/api/billing/checkout" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"plan":"starter"}')
echo "$CHECKOUT" | python3 -m json.tool
PAYMENT_URL=$(echo "$CHECKOUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('payment_url',''))")
if [[ -n "$PAYMENT_URL" ]]; then
  echo "Checkout URL prefix: ${PAYMENT_URL:0:60}..."
fi

echo "==> Analytics inboxes"
curl -sf "$API_URL/api/analytics/inboxes" -H "$AUTH" | python3 -m json.tool

echo "==> Latest send_log for pixel test"
CAMPAIGNS=$(curl -sf "$API_URL/api/campaigns" -H "$AUTH")
SEND_LOG_ID=$(echo "$CAMPAIGNS" | python3 -c "
import sys, json, subprocess
api = sys.argv[1]
token = sys.argv[2]
data = json.load(sys.stdin)
for c in data.get('campaigns', [])[:5]:
    r = subprocess.run(['curl','-sf',f'{api}/api/campaigns/{c[\"id\"]}/send-log','-H',f'Authorization: Bearer {token}'], capture_output=True, text=True)
    if r.returncode != 0:
        continue
    logs = json.loads(r.stdout).get('send_log', [])
    sent = [l for l in logs if l.get('status') == 'sent']
    if sent:
        print(sent[0]['id'])
        break
" "$API_URL" "$TOKEN")

if [[ -z "${SEND_LOG_ID:-}" ]]; then
  echo "No sent send_log found — run test-campaign-flow.sh first"
  exit 1
fi

echo "Send log ID: $SEND_LOG_ID"

echo "==> Tracking pixel"
curl -sf -D - "$API_URL/track/open/$SEND_LOG_ID" -o /tmp/mailthur-pixel.gif 2>&1 | head -15
file /tmp/mailthur-pixel.gif
wc -c /tmp/mailthur-pixel.gif

echo "==> Gmail reply webhook stub"
curl -sf -X POST "$API_URL/webhooks/gmail/reply" \
  -H "Content-Type: application/json" \
  -d "{\"send_log_id\":\"$SEND_LOG_ID\"}" | python3 -m json.tool

echo "==> Verify opened_at via send-log"
CAMPAIGN_ID=$(curl -sf "$API_URL/api/campaigns" -H "$AUTH" | python3 -c "
import sys,json,subprocess
api=sys.argv[1]; token=sys.argv[2]; sid=sys.argv[3]
for c in json.load(sys.stdin).get('campaigns',[]):
    r=subprocess.run(['curl','-sf',f'{api}/api/campaigns/{c[\"id\"]}/send-log','-H',f'Authorization: Bearer {token}'],capture_output=True,text=True)
    if sid in r.stdout:
        print(c['id']); break
" "$API_URL" "$TOKEN" "$SEND_LOG_ID")
curl -sf "$API_URL/api/campaigns/$CAMPAIGN_ID/send-log" -H "$AUTH" | python3 -c "
import sys,json
sid=sys.argv[1]
for row in json.load(sys.stdin).get('send_log',[]):
    if row['id']==sid:
        print(json.dumps({'id':row['id'],'status':row['status'],'opened_at':row.get('opened_at')}, indent=2))
        break
" "$SEND_LOG_ID"

echo "==> Done"
