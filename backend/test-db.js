// backend/test-db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testConnection = async () => {
  try {
    console.log("🔗 Testing MongoDB connection...");

    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/youtube-clone";

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Connected Successfully!");
    console.log("📊 Connection Details:");
    console.log(`   URI: ${mongoURI}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);

    // List collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📚 Collections:",
      collections.map((c) => c.name)
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

testConnection();
