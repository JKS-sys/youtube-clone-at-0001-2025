import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Video from "./models/Video.js";
import dotenv from "dotenv";

dotenv.config();

const seedJKSVideos = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/youtube-clone"
    );
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Channel.deleteMany({});
    await Video.deleteMany({});
    console.log("🧹 Cleared existing data");

    // Create the main JKSsys user
    const jksUser = await User.create({
      username: "JKSsys",
      email: "jks@example.com",
      password: "password123",
      avatar:
        "https://yt3.googleusercontent.com/ytc/APkrFKZXaIuwlAn7wPLczmq2QrtY5rFOLVduLhzwz2wepQ=s176-c-k-c0x00ffffff-no-rj",
      hasChannel: true,
    });
    console.log("👤 Created user: JKSsys");

    // Create the JKS-sys channel
    const jksChannel = await Channel.create({
      channelName: "JKS-sys",
      owner: jksUser._id,
      description:
        "System design explanations and coding tutorials. Learn how to build scalable systems and ace your interviews!",
      channelBanner:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300",
    });
    console.log("📺 Created channel: JKS-sys");

    // ✅ FIXED: YouTube embed URLs need proper format
    const videos = [
      {
        title: "No JKS voice explanation for GfG Streak - (393)",
        description: "Geek for Geeks streak solution video.",
        videoUrl: "https://www.youtube.com/embed/-Yt_w2b7U4c", // ✅ Fixed: /embed/ not /watch?v=
        thumbnailUrl:
          "https://img.youtube.com/vi/-Yt_w2b7U4c/maxresdefault.jpg",
        channelId: jksChannel._id,
        uploader: jksUser._id,
        views: 12500,
        category: "Education",
        tags: ["gfg", "streak", "coding", "explanation"],
        duration: "10:45",
      },
      {
        title: "No JKS voice explanation for GfG Streak - (392)",
        description: "Another GfG streak challenge explanation.",
        videoUrl: "https://www.youtube.com/embed/ABTO7Y1dqsk", // ✅ Fixed
        thumbnailUrl:
          "https://img.youtube.com/vi/ABTO7Y1dqsk/maxresdefault.jpg",
        channelId: jksChannel._id,
        uploader: jksUser._id,
        views: 9800,
        category: "Education",
        tags: ["gfg", "streak", "algorithm"],
        duration: "12:20",
      },
      {
        title: "JKS voice explanation for GfG Streak - (381)",
        description: "GfG streak with voice explanation.",
        videoUrl: "https://www.youtube.com/embed/ckuknS83bSo", // ✅ Fixed
        thumbnailUrl:
          "https://img.youtube.com/vi/ckuknS83bSo/maxresdefault.jpg",
        channelId: jksChannel._id,
        uploader: jksUser._id,
        views: 18700,
        category: "Education",
        tags: ["gfg", "streak", "voice", "tutorial"],
        duration: "15:30",
      },
      {
        title: "JKS voice explanation for GfG Streak - (377)",
        description: "Detailed explanation of GfG streak problem.",
        videoUrl: "https://www.youtube.com/embed/NZQJZ-9M7tQ", // ✅ Fixed
        thumbnailUrl:
          "https://img.youtube.com/vi/NZQJZ-9M7tQ/maxresdefault.jpg",
        channelId: jksChannel._id,
        uploader: jksUser._id,
        views: 15300,
        category: "Education",
        tags: ["gfg", "streak", "coding", "solution"],
        duration: "18:15",
      },
      {
        title: "JKS voice explanation for GfG Streak - (374)",
        description: "GfG streak challenge walkthrough.",
        videoUrl: "https://www.youtube.com/embed/uuVmXsT-W60", // ✅ Fixed
        thumbnailUrl:
          "https://img.youtube.com/vi/uuVmXsT-W60/maxresdefault.jpg",
        channelId: jksChannel._id,
        uploader: jksUser._id,
        views: 14200,
        category: "Education",
        tags: ["gfg", "streak", "walkthrough", "coding"],
        duration: "14:50",
      },
    ];

    const createdVideos = await Video.create(videos);
    console.log(`🎬 Created ${createdVideos.length} JKS-sys videos`);

    // Update channel with video references
    jksChannel.videos = createdVideos.map((v) => v._id);
    await jksChannel.save();

    // Update user with channel reference
    jksUser.channels = [jksChannel._id];
    await jksUser.save();

    console.log("\n" + "=".repeat(50));
    console.log("✅ SEED COMPLETE!");
    console.log("=".repeat(50));
    console.log("\n📊 DATA CREATED:");
    console.log(`   👤 User: ${jksUser.username}`);
    console.log(`   📺 Channel: ${jksChannel.channelName}`);
    console.log(`   🎬 Videos: ${createdVideos.length}`);

    console.log("\n🔑 TEST LOGIN:");
    console.log("   Email: jks@example.com");
    console.log("   Password: password123");

    console.log("\n📺 VIDEOS ADDED:");
    createdVideos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title}`);
    });
    console.log("=".repeat(50));

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedJKSVideos();
