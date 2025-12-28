// test-vercel.js - Quick API test
import fetch from "node-fetch";

async function testDeployment() {
  console.log("🚀 Testing Vercel Deployment Configuration\n");

  const tests = [
    { name: "Health Check", url: "/api/health" },
    { name: "Test Endpoint", url: "/api/test" },
    { name: "Get Videos", url: "/api/videos" },
  ];

  const baseURL = "http://localhost:5001";

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`   URL: ${baseURL}${test.url}`);

      const response = await fetch(`${baseURL}${test.url}`);
      const data = await response.text();

      // Check if it's HTML (bad) or JSON (good)
      if (data.includes("<!DOCTYPE html>")) {
        console.log(`   ❌ FAIL: Got HTML instead of JSON`);
        console.log(
          `   💡 Fix: Check your vercel.json routes and api/index.js`
        );
      } else {
        console.log(`   ✅ PASS: Got valid response`);
        console.log(`   📦 Response type: ${typeof data}`);
      }

      console.log("");
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.log("");
    }
  }

  console.log("📋 Summary:");
  console.log("1. If you get HTML: Vercel routing is wrong");
  console.log("2. If you get JSON: Routing is correct");
  console.log("3. If you get errors: Check MongoDB connection");
}

testDeployment();
