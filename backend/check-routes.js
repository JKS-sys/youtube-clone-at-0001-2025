import express from "express";

// Create a test app to check routes
const testApp = express();

// Load the routes file
try {
  console.log("🔍 Loading videos.js...");
  const videoRoutes = await import("./routes/videos.js");
  console.log("✅ Successfully loaded video routes module");

  // Mount the routes
  testApp.use("/api/videos", videoRoutes.default);

  // Get all registered routes
  const routes = [];
  testApp._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Regular route
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods),
      });
    } else if (middleware.name === "router") {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: "/api/videos" + handler.route.path,
            methods: Object.keys(handler.route.methods),
          });
        }
      });
    }
  });

  console.log("\n📋 Registered video routes:");
  routes.forEach((route) => {
    console.log(`  ${route.methods.join(", ").toUpperCase()} ${route.path}`);
  });

  // Check for PUT/DELETE
  const hasPut = routes.some((r) => r.methods.includes("put"));
  const hasDelete = routes.some((r) => r.methods.includes("delete"));

  console.log("\n✅ PUT routes exist:", hasPut);
  console.log("✅ DELETE routes exist:", hasDelete);

  if (!hasPut || !hasDelete) {
    console.log("\n❌ PROBLEM: Missing routes in videos.js");
    console.log("Check that your videos.js file has:");
    console.log('1. router.put("/:id", protect, ...)');
    console.log('2. router.delete("/:id", protect, ...)');
  }
} catch (error) {
  console.error("❌ Error loading routes:", error.message);
  console.error("Full error:", error);
}
