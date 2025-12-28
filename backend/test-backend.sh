#!/bin/bash

echo "🧪 Testing YouTube Clone Backend API"
echo "======================================"

BASE_URL="http://localhost:5001/api"

echo ""
echo "1. Testing health endpoint:"
curl -s "$BASE_URL/health" | head -1

echo ""
echo "2. Testing available routes:"
curl -s "$BASE_URL/test-routes" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/test-routes"

echo ""
echo "3. Testing GET /videos:"
curl -s "$BASE_URL/videos" | head -2

echo ""
echo "4. Testing if PUT route exists (should return JSON, not HTML error):"
RESPONSE=$(curl -s -X PUT "$BASE_URL/videos/test-id")
if [[ "$RESPONSE" == *"Cannot PUT"* ]] || [[ "$RESPONSE" == *"<!DOCTYPE html>"* ]]; then
    echo "   ❌ PUT route NOT FOUND (returns HTML error)"
else
    echo "   ✅ PUT route exists (returns JSON)"
    echo "   Response preview: ${RESPONSE:0:100}..."
fi

echo ""
echo "5. Testing if DELETE route exists:"
RESPONSE=$(curl -s -X DELETE "$BASE_URL/videos/test-id")
if [[ "$RESPONSE" == *"Cannot DELETE"* ]] || [[ "$RESPONSE" == *"<!DOCTYPE html>"* ]]; then
    echo "   ❌ DELETE route NOT FOUND (returns HTML error)"
else
    echo "   ✅ DELETE route exists (returns JSON)"
    echo "   Response preview: ${RESPONSE:0:100}..."
fi

echo ""
echo "======================================"
echo "If PUT/DELETE show ❌, check that:"
echo "1. server.js has the direct routes added"
echo "2. Backend server is running on port 5001"
echo "3. You restarted the server after changes"
