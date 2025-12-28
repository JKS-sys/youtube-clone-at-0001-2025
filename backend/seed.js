// backend/seed-fix.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Video from "./models/Video.js";
import dotenv from "dotenv";

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/youtube-clone"
    );
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Channel.deleteMany({});
    await Video.deleteMany({});

    // Create test user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.create({
      username: "JohnDoe",
      email: "john@example.com",
      password: hashedPassword,
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    });

    // Create channel
    const channel = await Channel.create({
      channelName: "Code with John",
      owner: user._id,
      description: "Coding tutorials and tech reviews",
      channelBanner: "https://picsum.photos/1200/300",
      subscribers: [user._id],
    });

    // Create sample videos with WORKING YouTube embed URLs
    const videos = await Video.create([
      {
        title: "Learn React in 30 Minutes",
        description: "A quick tutorial to get started with React",
        videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", // Working YouTube embed
        thumbnailUrl:
          "https://img.youtube.com/vi/SqcY0GlETPk/maxresdefault.jpg",
        channelId: channel._id,
        uploader: user._id,
        views: 15200,
        category: "Education",
        tags: ["react", "javascript", "tutorial"],
      },
      {
        title: "JavaScript Basics for Beginners",
        description: "Learn JavaScript fundamentals",
        videoUrl: "https://www.youtube.com/embed/W6NZfCO5SIk", // Working YouTube embed
        thumbnailUrl:
          "https://img.youtube.com/vi/W6NZfCO5SIk/maxresdefault.jpg",
        channelId: channel._id,
        uploader: user._id,
        views: 25300,
        category: "Education",
        tags: ["javascript", "beginners"],
      },
      {
        title: "Build a YouTube Clone with MERN Stack",
        description: "Full stack YouTube clone tutorial",
        videoUrl: "https://www.youtube.com/embed/FcwfjMebjTU", // Working YouTube embed
        thumbnailUrl:
          "https://img.youtube.com/vi/FcwfjMebjTU/maxresdefault.jpg",
        channelId: channel._id,
        uploader: user._id,
        views: 10500,
        category: "Technology",
        tags: ["mern", "youtube", "clone"],
      },
    ]);

    // Update channel with videos
    channel.videos = videos.map((v) => v._id);
    await channel.save();

    // Update user with channel
    user.channels = [channel._id];
    await user.save();

    console.log("✅ Database seeded successfully!");
    console.log("====================================");
    console.log("Test Credentials:");
    console.log("Email: john@example.com");
    console.log("Password: password123");
    console.log("====================================");
    console.log("Working videos added with YouTube embed URLs");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
