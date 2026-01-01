import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Video from "./models/Video.js";
import dotenv from "dotenv";

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/youtube-clone"
    );
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Channel.deleteMany({});
    await Video.deleteMany({});
    console.log("🧹 Cleared existing data");

    // Create users
    const users = [
      {
        username: "JKSsys",
        email: "jks@example.com",
        password: "password123",
        avatar:
          "https://ui-avatars.com/api/?name=JKSsys&background=FF0000&color=fff",
      },
      {
        username: "JohnDoe",
        email: "john@example.com",
        password: "password123",
        avatar:
          "https://ui-avatars.com/api/?name=John+Doe&background=065fd4&color=fff",
      },
      {
        username: "JaneSmith",
        email: "jane@example.com",
        password: "password123",
        avatar:
          "https://ui-avatars.com/api/?name=Jane+Smith&background=FF69B4&color=fff",
      },
    ];

    const createdUsers = await User.create(users);
    console.log(`👤 Created ${createdUsers.length} users`);

    // Create channels
    const channels = [
      {
        channelName: "JKS-sys",
        owner: createdUsers[0]._id,
        description:
          "System design explanations and coding tutorials. Learn how to build scalable systems!",
        channelBanner:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300",
        channelAvatar:
          "https://ui-avatars.com/api/?name=JKSsys&background=FF0000&color=fff&bold=true",
      },
      {
        channelName: "Code with John",
        owner: createdUsers[1]._id,
        description:
          "Learn programming with easy-to-follow tutorials and coding challenges.",
        channelBanner:
          "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300",
        channelAvatar:
          "https://ui-avatars.com/api/?name=Code+with+John&background=065fd4&color=fff&bold=true",
      },
    ];

    const createdChannels = await Channel.create(channels);
    console.log(`📺 Created ${createdChannels.length} channels`);

    // Create videos
    const videos = [
      // JKS-sys videos
      {
        title: "No JKS voice explanation for GfG Streak - (393)",
        description:
          "Geek for Geeks streak solution video. Learn how to solve the GfG streak challenge.",
        videoUrl: "https://www.youtube.com/embed/-Yt_w2b7U4c",
        thumbnailUrl:
          "https://img.youtube.com/vi/-Yt_w2b7U4c/maxresdefault.jpg",
        channelId: createdChannels[0]._id,
        uploader: createdUsers[0]._id,
        views: 12500,
        category: "Education",
        tags: ["gfg", "streak", "coding", "algorithm"],
        duration: "10:45",
      },
      {
        title: "No JKS voice explanation for GfG Streak - (392)",
        description:
          "Another GfG streak challenge explanation with advanced techniques.",
        videoUrl: "https://www.youtube.com/embed/ABTO7Y1dqsk",
        thumbnailUrl:
          "https://img.youtube.com/vi/ABTO7Y1dqsk/maxresdefault.jpg",
        channelId: createdChannels[0]._id,
        uploader: createdUsers[0]._id,
        views: 9800,
        category: "Education",
        tags: ["gfg", "streak", "algorithm"],
        duration: "12:20",
      },
      // Code with John videos
      {
        title: "Learn React in 30 Minutes",
        description:
          "A quick tutorial to get started with React. Perfect for beginners!",
        videoUrl: "https://www.youtube.com/embed/ABTO7Y1dqsk",
        thumbnailUrl:
          "https://img.youtube.com/vi/w7ejDZ8SWv8/maxresdefault.jpg",
        channelId: createdChannels[1]._id,
        uploader: createdUsers[1]._id,
        views: 15200,
        category: "Education",
        tags: ["react", "tutorial", "javascript", "frontend"],
        duration: "28:15",
      },
      {
        title: "JavaScript Fundamentals for Beginners",
        description: "Learn JavaScript basics in this comprehensive tutorial.",
        videoUrl: "https://www.youtube.com/embed/ABTO7Y1dqsk",
        thumbnailUrl:
          "https://img.youtube.com/vi/W6NZfCO5SIk/maxresdefault.jpg",
        channelId: createdChannels[1]._id,
        uploader: createdUsers[1]._id,
        views: 24300,
        category: "Education",
        tags: ["javascript", "programming", "tutorial"],
        duration: "45:30",
      },
      {
        title: "Build a Todo App with React",
        description: "Learn React by building a practical todo application.",
        videoUrl: "https://www.youtube.com/embed/ABTO7Y1dqsk",
        thumbnailUrl:
          "https://img.youtube.com/vi/pCA4qpQDZD8/maxresdefault.jpg",
        channelId: createdChannels[1]._id,
        uploader: createdUsers[1]._id,
        views: 18700,
        category: "Education",
        tags: ["react", "todo", "app", "project"],
        duration: "38:45",
      },
      // More videos in different categories
      {
        title: "Gaming Highlights: Best Moments 2024",
        description: "Top gaming moments from 2024. Epic wins and funny fails!",
        videoUrl: "https://www.youtube.com/embed/ABTO7Y1dqsk",
        thumbnailUrl:
          "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        channelId: createdChannels[0]._id,
        uploader: createdUsers[0]._id,
        views: 56700,
        category: "Gaming",
        tags: ["gaming", "highlights", "2024"],
        duration: "15:20",
      },
      {
        title: "Tech News Weekly Update",
        description: "Latest tech news and gadget releases of the week.",
        videoUrl: "https://www.youtube.com/embed/ABTO7Y1dqsk",
        thumbnailUrl:
          "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
        channelId: createdChannels[1]._id,
        uploader: createdUsers[1]._id,
        views: 32100,
        category: "Technology",
        tags: ["tech", "news", "gadgets"],
        duration: "22:10",
      },
      {
        title: "Music Mix 2024 - Best of Electronic",
        description: "One hour of the best electronic music tracks from 2024.",
        videoUrl: "https://www.youtube.com/embed/ABTO7Y1dqsk",
        thumbnailUrl:
          "https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg",
        channelId: createdChannels[0]._id,
        uploader: createdUsers[0]._id,
        views: 89200,
        category: "Music",
        tags: ["music", "electronic", "2024", "mix"],
        duration: "60:00",
      },
    ];

    const createdVideos = await Video.create(videos);
    console.log(`🎬 Created ${createdVideos.length} videos`);

    // Update channels with video references
    for (const channel of createdChannels) {
      const channelVideos = createdVideos.filter(
        (v) => v.channelId.toString() === channel._id.toString()
      );
      channel.videos = channelVideos.map((v) => v._id);
      await channel.save();
    }

    // Update users with channel references
    for (const user of createdUsers) {
      const userChannels = createdChannels.filter(
        (c) => c.owner.toString() === user._id.toString()
      );
      user.channels = userChannels.map((c) => c._id);
      user.hasChannel = userChannels.length > 0;
      await user.save();
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ DATABASE SEEDED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`👤 Users: ${createdUsers.length}`);
    console.log(`📺 Channels: ${createdChannels.length}`);
    console.log(`🎬 Videos: ${createdVideos.length}`);
    console.log("\n🔑 TEST CREDENTIALS:");
    console.log("1. JKSsys - jks@example.com / password123");
    console.log("2. JohnDoe - john@example.com / password123");
    console.log("3. JaneSmith - jane@example.com / password123");
    console.log("\n🚀 To start: npm run dev");

    // Close connection
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
