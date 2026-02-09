#!/bin/bash
echo "Testing quota error detection..."
echo ""

# Try to run agents (will hit quota error)
curl -s -X POST http://localhost:8000/run_sse \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "WeekendPlanner",
    "user_id": "test_user",
    "session_id": "test_session",
    "new_message": {
      "role": "user",
      "parts": [{"text": "test"}]
    },
    "streaming": true
  }' | head -5

echo ""
echo "✅ Quota error should be detected by frontend"
