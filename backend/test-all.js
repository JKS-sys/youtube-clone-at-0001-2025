// backend/test-all.js - Test ALL routes
import fetch from "node-fetch";

const BASE_URL = "http://localhost:5001/api";

async function testAllRoutes() {
  console.log("🧪 Testing ALL API Routes\n");

  const tests = [
    // Public routes
    { method: "GET", url: "/health", auth: false },
    { method: "GET", url: "/test-routes", auth: false },
    { method: "GET", url: "/videos", auth: false },

    // Video CRUD (will need auth token)
    {
      method: "PUT",
      url: "/videos/test-id",
      auth: true,
      body: { title: "Test Update" },
    },
    { method: "DELETE", url: "/videos/test-id", auth: true },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`🔍 ${test.method} ${test.url}`);

    try {
      const options = {
        method: test.method,
        headers: { "Content-Type": "application/json" },
      };

      if (test.body) options.body = JSON.stringify(test.body);

      const response = await fetch(`${BASE_URL}${test.url}`, options);
      const text = await response.text();

      // Check if it's HTML error (404) or JSON
      if (text.includes("Cannot") && text.includes("<!DOCTYPE html>")) {
        console.log(`   ❌ 404: Route not found`);
        failed++;
      } else {
        console.log(`   ✅ ${response.status}: Route exists`);
        passed++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
    console.log("");
  }

  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log("\n💡 If PUT/DELETE fail:");
  console.log("   1. Check server.js has direct routes added");
  console.log("   2. Make sure Video model is imported in server.js");
  console.log("   3. Restart backend server");
}

testAllRoutes();
