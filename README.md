# YouTube Clone - MERN Stack Capstone Project

A full-featured YouTube clone built with the MERN (MongoDB, Express.js, React, Node.js) stack. This project implements core YouTube functionalities including video uploads, user authentication, comments, likes/dislikes, channels, and search/filter capabilities.

## ✨ Features

### **Core Features**

- ✅ **User Authentication** - JWT-based registration and login
- ✅ **Video Management** - Full CRUD operations for videos
- ✅ **Comment System** - Add, edit, delete comments with user ownership
- ✅ **Like/Dislike System** - Interactive video rating
- ✅ **Channel Management** - Create and manage personal channels
- ✅ **Search & Filter** - Search by title and filter by 6+ categories
- ✅ **Responsive Design** - Mobile-first responsive layout

### **Pages & Components**

- **Home Page** - Video grid with sidebar and filter buttons
- **Video Player** - Full-featured player with comments and interactions
- **Channel Page** - Manage uploaded videos with CRUD operations
- **Authentication** - Secure login/registration with form validation
- **Header & Sidebar** - Navigation with toggle functionality

## 🏗️ Project Architecture

```
youtube-clone/
├── api/                    # Vercel serverless functions
│   └── index.js           # API entry point for production
├── backend/               # Express.js backend
│   ├── models/           # MongoDB schemas (User, Video, Channel)
│   ├── routes/           # API routes (auth, videos, channels)
│   ├── middleware/       # Authentication middleware
│   └── server.js         # Backend server
├── frontend/             # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context (Auth)
│   │   ├── services/     # API service layer
│   │   └── styles/       # CSS files
│   └── vite.config.js    # Vite configuration
├── vercel.json           # Vercel deployment configuration
└── package.json          # Root package.json
```

## 🚀 Quick Start

### **Prerequisites**

- Node.js (v18 or higher)
- MongoDB (Local or Atlas)
- Git

### **1. Clone & Setup**

```bash
# Clone repository
git clone https://github.com/yourusername/youtube-clone.git
cd youtube-clone

# Install all dependencies
npm run install:all
```

### **2. Environment Setup**

Create `.env` file in the **backend** directory:

```env
MONGODB_URI=mongodb://localhost:27017/youtube-clone
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5001
NODE_ENV=development
```

### **3. Seed Database**

```bash
# Navigate to backend
cd backend

# Seed with sample data
npm run seed

# Expected output:
# ✅ Created 2 users
# ✅ Created 2 channels
# ✅ Created 8 videos
# ✅ Database seeded successfully!
```

### **4. Start Development Servers**

```bash
# From project root
npm run dev

# This starts:
# Frontend: http://localhost:3000
# Backend:  http://localhost:5001
```

### **5. Test Application**

1. Open browser to `http://localhost:3000`
2. Click "Sign In" to register/login
3. Use test credentials:
   - **Email:** john@example.com
   - **Password:** password123

## 📚 Database Schema

### **User Schema**

```javascript
{
  username: String,      // Unique username
  email: String,         // Unique email
  password: String,      // Hashed password
  avatar: String,        // Profile image URL
  channels: [ObjectId]   // User's channels
}
```

### **Video Schema**

```javascript
{
  title: String,         // Video title
  description: String,   // Video description
  videoUrl: String,      // Video file URL
  thumbnailUrl: String,  // Thumbnail image URL
  channelId: ObjectId,   // Associated channel
  uploader: ObjectId,    // User who uploaded
  views: Number,         // View count
  likes: [ObjectId],     // Users who liked
  dislikes: [ObjectId],  // Users who disliked
  category: String,      // Video category
  tags: [String],        // Video tags
  comments: [{
    userId: ObjectId,    // Comment author
    text: String,        // Comment text
    createdAt: Date      // Comment timestamp
  }]
}
```

### **Channel Schema**

```javascript
{
  channelName: String,   // Unique channel name
  owner: ObjectId,       // Channel owner
  description: String,   // Channel description
  channelBanner: String, // Banner image URL
  subscribers: [ObjectId], // Subscribers
  videos: [ObjectId]     // Channel videos
}
```

## 🔧 API Endpoints

### **Authentication**

| Method | Endpoint             | Description       | Protected |
| ------ | -------------------- | ----------------- | --------- |
| POST   | `/api/auth/register` | Register new user | No        |
| POST   | `/api/auth/login`    | Login user        | No        |
| GET    | `/api/auth/me`       | Get current user  | Yes       |

### **Videos**

| Method | Endpoint                  | Description                         | Protected |
| ------ | ------------------------- | ----------------------------------- | --------- |
| GET    | `/api/videos`             | Get all videos (with search/filter) | No        |
| GET    | `/api/videos/:id`         | Get single video                    | No        |
| POST   | `/api/videos`             | Create new video                    | Yes       |
| PUT    | `/api/videos/:id`         | Update video                        | Yes       |
| DELETE | `/api/videos/:id`         | Delete video                        | Yes       |
| POST   | `/api/videos/:id/like`    | Like video                          | Yes       |
| POST   | `/api/videos/:id/dislike` | Dislike video                       | Yes       |

### **Comments**

| Method | Endpoint                                   | Description    | Protected |
| ------ | ------------------------------------------ | -------------- | --------- |
| POST   | `/api/videos/:id/comments`                 | Add comment    | Yes       |
| PUT    | `/api/videos/:videoId/comments/:commentId` | Update comment | Yes       |
| DELETE | `/api/videos/:videoId/comments/:commentId` | Delete comment | Yes       |

### **Channels**

| Method | Endpoint                     | Description         | Protected |
| ------ | ---------------------------- | ------------------- | --------- |
| POST   | `/api/channels`              | Create channel      | Yes       |
| GET    | `/api/channels/:id`          | Get channel details | No        |
| GET    | `/api/channels/user/:userId` | Get user's channels | No        |
| PUT    | `/api/channels/:id`          | Update channel      | Yes       |
| DELETE | `/api/channels/:id`          | Delete channel      | Yes       |

## 🎨 Frontend Components

### **Core Components**

1. **Header** (`components/Header.jsx`)

   - Search functionality
   - User authentication state
   - Navigation menu toggle

2. **Sidebar** (`components/Sidebar.jsx`)

   - Collapsible navigation
   - Category filters
   - Mobile-responsive

3. **VideoCard** (`components/VideoCard.jsx`)

   - Thumbnail display
   - Video metadata (title, channel, views)
   - Responsive grid layout

4. **VideoPlayer** (`pages/VideoPlayer.jsx`)

   - ReactPlayer integration
   - Like/Dislike buttons
   - Comment section

5. **CommentSection** (`components/CommentSection.jsx`)
   - Add/edit/delete comments
   - User authentication checks
   - Real-time updates

### **Pages**

- **Home** (`pages/Home.jsx`) - Main video browsing page
- **Auth** (`pages/Auth.jsx`) - Login/registration
- **Channel** (`pages/Channel.jsx`) - Channel management
- **CreateChannel** (`pages/CreateChannel.jsx`) - Channel creation

## 🚀 Deployment

### **Vercel Deployment**

1. **Prepare for Deployment**

```bash
# Build frontend
cd frontend
npm run build

# Create api/index.js for Vercel (see setup section)
```

2. **Vercel Configuration** (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/(.*)", "dest": "/frontend/dist/$1" }
  ]
}
```

3. **Environment Variables on Vercel**

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production
```

4. **Deploy Command**

```bash
vercel --prod
```

### **Manual Deployment Steps**

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically or manually trigger deployment

## 📱 Responsive Design

The application is fully responsive across all devices:

| Device                | Layout        | Features                          |
| --------------------- | ------------- | --------------------------------- |
| Mobile (≤768px)       | Single column | Collapsed sidebar, hamburger menu |
| Tablet (769px-1024px) | Two columns   | Visible sidebar, responsive grid  |
| Desktop (≥1025px)     | Three columns | Full sidebar, expanded layout     |

## 🧪 Testing

### **Test Credentials**

```javascript
// Pre-seeded users
{
  email: "john@example.com",
  password: "password123",
  username: "JohnDoe"
},
{
  email: "jane@example.com",
  password: "password123",
  username: "JaneSmith"
}
```

### **API Testing with cURL**

```bash
# Test health endpoint
curl http://localhost:5001/api/health

# Get all videos
curl http://localhost:5001/api/videos

# Test authentication
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## 🔍 Search & Filter Functionality

### **Search Implementation**

- Real-time search as you type
- Searches video titles using MongoDB regex
- URL query parameter support

### **Category Filters**

6+ categories available:

- Music
- Sports
- Gaming
- Education
- Entertainment
- Technology

## 🛠️ Development

### **Available Scripts**

```bash
# Root directory
npm run dev              # Start both frontend and backend
npm run install:all      # Install all dependencies
npm run build            # Build frontend for production

# Backend directory
npm run dev              # Start backend with nodemon
npm run seed             # Seed database with sample data
npm start                # Start backend server

# Frontend directory
npm run dev              # Start Vite development server
npm run build            # Build for production
npm run preview          # Preview production build
```

### **Technology Stack**

| Layer            | Technology       | Purpose                 |
| ---------------- | ---------------- | ----------------------- |
| Frontend         | React 18         | UI Components           |
| Build Tool       | Vite             | Fast development/build  |
| Routing          | React Router DOM | Client-side routing     |
| HTTP Client      | Axios            | API requests            |
| Video Player     | React Player     | Video playback          |
| Icons            | React Icons      | UI icons                |
| Backend          | Express.js       | API server              |
| Database         | MongoDB          | Data storage            |
| ODM              | Mongoose         | MongoDB object modeling |
| Authentication   | JWT              | User authentication     |
| Password Hashing | bcryptjs         | Secure password storage |
| Environment      | dotenv           | Environment variables   |
| Development      | Nodemon          | Auto-restart server     |
| Concurrent       | concurrently     | Run multiple commands   |

## 📝 Code Quality

### **ESLint Configuration**

```javascript
// .eslintrc.js
module.exports = {
  extends: ["eslint:recommended", "plugin:react/recommended"],
  rules: {
    "no-unused-vars": "warn",
    "react/prop-types": "off",
  },
};
```

### **Folder Structure Guidelines**

```
src/
├── components/          # Reusable components
│   ├── common/         # Shared components
│   └── layout/         # Layout components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # App constants
└── styles/             # Global styles
```

## 🐛 Troubleshooting

### **Common Issues & Solutions**

1. **MongoDB Connection Failed**

   ```
   Error: MongoDB Connection Error
   Solution: Ensure MongoDB is running locally or use MongoDB Atlas
   ```

2. **CORS Errors**

   ```
   Error: Cross-Origin Request Blocked
   Solution: Check backend CORS configuration
   ```

3. **JWT Authentication Issues**

   ```
   Error: jwt malformed
   Solution: Clear localStorage tokens and re-login
   ```

4. **Vercel Deployment - API Returns HTML**
   ```
   Error: API returns HTML instead of JSON
   Solution: Ensure correct vercel.json routing configuration
   ```

### **Debug Commands**

```bash
# Check MongoDB connection
mongod --version
mongo --version

# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📊 Project Rubrics Coverage

| Requirement          | Status      | Implementation                                  |
| -------------------- | ----------- | ----------------------------------------------- |
| Home Page UI/UX      | ✅ Complete | Header, sidebar, video grid, filter buttons     |
| User Authentication  | ✅ Complete | JWT-based, form validation, error handling      |
| Video Player Page    | ✅ Complete | Player, comments, like/dislike, CRUD operations |
| Channel Page         | ✅ Complete | Video CRUD, channel management                  |
| API Design           | ✅ Complete | RESTful endpoints, proper error handling        |
| Data Handling        | ✅ Complete | MongoDB with Mongoose, relationships            |
| JWT Integration      | ✅ Complete | Protected routes, token validation              |
| Search Functionality | ✅ Complete | Title search, URL parameters                    |
| Filter by Category   | ✅ Complete | 6+ categories, dynamic filtering                |
| Responsive Design    | ✅ Complete | Mobile-first, all screen sizes                  |
| Code Structure       | ✅ Complete | Modular, clean, organized                       |
| Documentation        | ✅ Complete | README, code comments                           |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Commit Convention**

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code formatting
refactor: Code restructuring
test:     Testing
chore:    Maintenance
```

## 📄 License

This project is for educational purposes as part of a capstone project. Not intended for commercial use.

## 🙏 Acknowledgments

- YouTube for design inspiration
- MERN stack community for resources and tutorials
- Vercel for hosting platform
- MongoDB for database solution

## 📞 Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review API documentation
3. Check console logs for errors
4. Contact: [Your Email/Contact Info]

---

**Project Status**: ✅ Complete - Ready for Capstone Submission  
**Last Updated**: December 2024  
**Deployment**: Vercel  
**Database**: MongoDB Atlas

_This project demonstrates full-stack development skills with the MERN stack, implementing real-world features with production-ready code quality._
