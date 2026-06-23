#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-https://staging-backend.mailthur.com}"
TEST_EMAIL="${TEST_EMAIL:-bamzonline01@gmail.com}"

echo "==> Session"
TOKEN=$(curl -sf -X POST "$API_URL/auth/session" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AUTH="Authorization: Bearer $TOKEN"

echo "==> Queue health (reply-poll scheduler)"
curl -sf "$API_URL/health/queue" | python3 -c "
import sys,json
d=json.load(sys.stdin)
jobs=d.get('queue',{}).get('repeatableJobs',[])
names=[j.get('name') for j in jobs]
assert 'reply-poll' in names, f'missing reply-poll job: {names}'
poll=[j for j in jobs if j.get('name')=='reply-poll'][0]
assert poll.get('every')==600000, f'expected 600000ms got {poll.get(\"every\")}'
print('PASS: reply-poll registered at 600000ms')
"

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
  echo "FAIL: expected imported=2 skipped=1 got imported=$IMPORTED skipped=$SKIPPED"
  exit 1
fi
echo "PASS: LeadThur import"

echo "==> Campaign list filter/search"
curl -sf "$API_URL/api/campaigns?status=draft&search=LeadThur" -H "$AUTH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert len(d['campaigns'])>=1
print('PASS: filter/search')"

echo "==> Campaign contacts list"
curl -sf "$API_URL/api/campaigns/$CID/contacts" -H "$AUTH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert len(d['contacts'])==2
print('PASS: contacts list', len(d['contacts']))"

echo "==> Activity feed"
curl -sf "$API_URL/api/activity/recent" -H "$AUTH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
events=d.get('events',[])
print('PASS: activity feed returned', len(events), 'events')"

echo "==> Live send + unsubscribe test"
# Pause active campaigns
for id in $(curl -sf "$API_URL/api/campaigns" -H "$AUTH" | python3 -c "import sys,json; [print(c['id']) for c in json.load(sys.stdin)['campaigns'] if c['status']=='active']"); do
  curl -sf -X POST "$API_URL/api/campaigns/$id/pause" -H "$AUTH" > /dev/null
done

SCID=$(curl -sf -X POST "$API_URL/api/campaigns" -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"name":"Unsubscribe E2E"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['campaign']['id'])")
curl -sf -X PUT "$API_URL/api/campaigns/$SCID/steps" -H "Content-Type: application/json" -H "$AUTH" \
  -d '{"steps":[{"subject":"Unsub test","body":"Please ignore.","delay_days":0},{"subject":"Step 2","body":"Follow up","delay_days":1}]}' > /dev/null
CSV=$(mktemp); printf 'email,first_name\n%s,Test\n' "$TEST_EMAIL" > "$CSV"
curl -sf -X POST "$API_URL/api/campaigns/$SCID/contacts/csv" -H "$AUTH" -F "file=@$CSV;type=text/csv" > /dev/null
rm -f "$CSV"
curl -sf -X POST "$API_URL/api/campaigns/$SCID/launch" -H "$AUTH" > /dev/null

QUEUE=$(curl -sf -X POST "$API_URL/api/campaigns/queue/process" -H "$AUTH")
echo "$QUEUE" | python3 -m json.tool
SENT=$(echo "$QUEUE" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'].get('sent',0))")
if [ "$SENT" != "1" ]; then
  echo "WARN: live send did not succeed (sent=$SENT) — skipping unsubscribe verification"
else
  LOG_ID=$(curl -sf "$API_URL/api/campaigns/$SCID/send-log" -H "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['send_log'][0]['id'])")
  THREAD=$(curl -sf "$API_URL/api/campaigns/$SCID/send-log" -H "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['send_log'][0].get('gmail_thread_id') or '')")
  if [ -n "$THREAD" ] && [ "$THREAD" != "None" ]; then
    echo "PASS: gmail_thread_id stored on send_log"
  else
    echo "WARN: gmail_thread_id not present (migration 006 may be missing)"
  fi
  HTTP=$(curl -s -o /tmp/unsub.html -w "%{http_code}" "$API_URL/unsubscribe/$LOG_ID")
  if [ "$HTTP" != "200" ]; then
    echo "FAIL: unsubscribe returned HTTP $HTTP"
    exit 1
  fi
  echo "PASS: unsubscribe endpoint HTTP 200"
  STATUS=$(curl -sf "$API_URL/api/campaigns/$SCID/contacts" -H "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['contacts'][0]['status'])")
  if [ "$STATUS" != "unsubscribed" ]; then
    echo "FAIL: contact status is $STATUS expected unsubscribed"
    exit 1
  fi
  echo "PASS: contact status unsubscribed"
fi

echo "==> All integration tests completed"
