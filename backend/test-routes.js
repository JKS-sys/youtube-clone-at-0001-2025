// backend/test-routes.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function testAllRoutes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/youtube-clone"
    );
    console.log("✅ Connected to MongoDB");

    // Import models
    const Video = (await import("./models/Video.js")).default;
    const User = (await import("./models/User.js")).default;

    // Get a test video
    const videos = await Video.find().limit(1);
    if (videos.length === 0) {
      console.log("❌ No videos found. Run seed.js first.");
      return;
    }

    const testVideo = videos[0];
    console.log(`📹 Test Video ID: ${testVideo._id}`);

    // Test all endpoints
    const endpoints = [
      { method: "GET", url: `/api/videos` },
      { method: "GET", url: `/api/videos/${testVideo._id}` },
      { method: "PUT", url: `/api/videos/${testVideo._id}` },
      { method: "DELETE", url: `/api/videos/${testVideo._id}` },
      { method: "POST", url: `/api/videos/${testVideo._id}/like` },
      { method: "POST", url: `/api/videos/${testVideo._id}/comments` },
    ];

    console.log("\n✅ All routes should exist in videos.js:");
    endpoints.forEach((ep) => {
      console.log(`  ${ep.method} ${ep.url}`);
    });

    // Check if video has comments
    if (testVideo.comments && testVideo.comments.length > 0) {
      const commentId = testVideo.comments[0]._id;
      console.log(`\n✅ Comment routes (using comment ID: ${commentId}):`);
      console.log(`  PUT /api/videos/${testVideo._id}/comments/${commentId}`);
      console.log(
        `  DELETE /api/videos/${testVideo._id}/comments/${commentId}`
      );
    }

    console.log("\n🔧 If PUT/DELETE return 404, check that:");
    console.log("  1. The routes exist in videos.js");
    console.log("  2. They are exported correctly");
    console.log("  3. server.js imports videos.js");

    await mongoose.disconnect();
    console.log("✅ Test complete");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAllRoutes();
