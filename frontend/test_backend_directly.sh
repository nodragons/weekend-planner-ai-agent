#!/bin/bash

echo "=== Testing ADK Backend Directly ==="
echo ""

# Step 1: Create session
echo "1. Creating session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:8000/apps/WeekendPlanner/users/testuser_$(date +%s)/sessions \
  -H "Content-Type: application/json" \
  -d '{}')

SESSION_ID=$(echo $SESSION_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('id', 'ERROR'))")
USER_ID=$(echo $SESSION_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('userId', 'ERROR'))")

echo "  Session ID: $SESSION_ID"
echo "  User ID: $USER_ID"
echo ""

# Step 2: Test /run_sse endpoint
echo "2. Testing /run_sse endpoint..."
echo "  Request payload:"
cat <<JSON
{
  "app_name": "WeekendPlanner",
  "user_id": "$USER_ID",
  "session_id": "$SESSION_ID",
  "new_message": {
    "role": "user",
    "parts": [{"text": "90210 kids are 5 and 8"}]
  },
  "streaming": true
}
JSON
echo ""
echo "  Response (first 100 lines):"
echo ""

curl -X POST http://localhost:8000/run_sse \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d "{
    \"app_name\": \"WeekendPlanner\",
    \"user_id\": \"$USER_ID\",
    \"session_id\": \"$SESSION_ID\",
    \"new_message\": {
      \"role\": \"user\",
      \"parts\": [{\"text\": \"90210 kids are 5 and 8\"}]
    },
    \"streaming\": true
  }" 2>&1 | head -100
