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

    // Create sample videos
    const videos = await Video.create([
      {
        title: "Learn React in 30 Minutes",
        description: "A quick tutorial to get started with React",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnailUrl: "https://picsum.photos/320/180",
        channelId: channel._id,
        uploader: user._id,
        views: 15200,
        category: "Education",
        tags: ["react", "javascript", "tutorial"],
      },
      {
        title: "JavaScript Basics for Beginners",
        description: "Learn JavaScript fundamentals",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumbnailUrl: "https://picsum.photos/320/181",
        channelId: channel._id,
        uploader: user._id,
        views: 25300,
        category: "Education",
        tags: ["javascript", "beginners"],
      },
    ]);

    // Update channel with videos
    channel.videos = videos.map((v) => v._id);
    await channel.save();

    // Update user with channel
    user.channels = [channel._id];
    await user.save();

    console.log("✅ Database seeded successfully!");
    console.log("Test Credentials:");
    console.log("Email: john@example.com");
    console.log("Password: password123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
