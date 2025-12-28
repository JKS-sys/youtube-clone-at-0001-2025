# YouTube Clone - MERN Stack Capstone Project

A full-featured YouTube clone built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

### ✅ Completed

- User Authentication (JWT-based)
- Video CRUD operations
- Comment CRUD operations
- Like/Dislike system
- Search & Filter functionality
- Responsive design
- Channel management
- Video player with ReactPlayer

### 🔧 Technologies Used

1. **Frontend**

   - React 18
   - React Router DOM
   - React Player
   - React Icons
   - Axios
   - Vite (Build tool)

2. **Backend**
   - Node.js
   - Express.js
   - MongoDB with Mongoose
   - JWT Authentication
   - CORS
   - Bcrypt.js

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/youtube-clone
JWT_SECRET=your_super_secret_jwt_key_here_change_this
PORT=5001
```

4. Seed the database:

```bash
npm run seed
```

5. Start the server:

```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Videos

- `GET /api/videos` - Get all videos (with search & filter)
- `GET /api/videos/:id` - Get single video
- `POST /api/videos` - Create video (protected)
- `PUT /api/videos/:id` - Update video (protected)
- `DELETE /api/videos/:id` - Delete video (protected)
- `POST /api/videos/:id/like` - Like video (protected)
- `POST /api/videos/:id/dislike` - Dislike video (protected)

### Comments

- `POST /api/videos/:id/comments` - Add comment (protected)
- `PUT /api/videos/:videoId/comments/:commentId` - Update comment (protected)
- `DELETE /api/videos/:videoId/comments/:commentId` - Delete comment (protected)

### Channels

- `POST /api/channels` - Create channel (protected)
- `GET /api/channels/:id` - Get channel details
- `GET /api/channels/user/:userId` - Get user's channels
- `PUT /api/channels/:id` - Update channel (protected)
- `DELETE /api/channels/:id` - Delete channel (protected)

## Project Structure

```
youtube-clone-mern/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── VideoCard.jsx
│   │   │   ├── LikeDislikeButtons.jsx
│   │   │   └── CommentSection.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── Channel.jsx
│   │   │   ├── Auth.jsx
│   │   │   └── CreateChannel.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── context/
│   │       └── AuthContext.jsx
│   └── package.json
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Video.js
│   │   └── Channel.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── videos.js
│   │   └── channels.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
└── README.md
```

## Database Schema

### User

```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  avatar: String,
  channels: [Channel._id]
}
```

### Video

```javascript
{
  title: String,
  description: String,
  videoUrl: String,
  thumbnailUrl: String,
  channelId: ObjectId,
  uploader: ObjectId,
  views: Number,
  likes: [User._id],
  dislikes: [User._id],
  category: String,
  tags: [String],
  comments: [{
    userId: ObjectId,
    text: String,
    createdAt: Date
  }]
}
```

### Channel

```javascript
{
  channelName: String,
  owner: ObjectId,
  description: String,
  channelBanner: String,
  subscribers: [User._id],
  videos: [Video._id]
}
```

## Testing Credentials

You can use these test accounts:

1. **Admin User:**

   - Email: john@example.com
   - Password: password123

2. **Regular User:**
   - Email: jane@example.com
   - Password: password123

Or register your own account.

### Frontend Deployment (Netlify/Vercel)

1. Build the project: `npm run build`
2. Deploy the `dist` folder

## Git Commit Strategy

Make meaningful commits:

```
feat: add video like functionality
fix: resolve search debounce issue
docs: update README with setup instructions
style: improve responsive design
refactor: optimize API calls
test: add unit tests for auth
```

## License

This project is for educational purposes only.

## Contact

For any questions or issues, please create an issue in the repository.

````

### **7. Create package.json in Root**

Create `package.json` in the root directory:

```json
{
  "name": "youtube-clone-mern",
  "version": "1.0.0",
  "description": "YouTube Clone with MERN Stack - Capstone Project",
  "main": "index.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "seed": "cd backend && node seed.js",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "start": "cd backend && npm start"
  },
  "keywords": [
    "mern",
    "youtube-clone",
    "react",
    "nodejs",
    "mongodb",
    "express"
  ],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
````
