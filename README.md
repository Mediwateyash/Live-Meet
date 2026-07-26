# Zenius AI — Learn Without Limits 🎥🎓

<div align="center">

  ![Node.js](https://img.shields.io/badge/NODE.JS-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express.js](https://img.shields.io/badge/EXPRESS.JS-5-000000?style=for-the-badge&logo=express&logoColor=white)
  ![React](https://img.shields.io/badge/REACT-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/VITE-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/TAILWIND%20CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
  
  ![MongoDB](https://img.shields.io/badge/MONGODB-6%2B-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Socket.io](https://img.shields.io/badge/SOCKET.IO-4%2B-010101?style=for-the-badge&logo=socket.io&logoColor=white)
  ![WebRTC](https://img.shields.io/badge/WEBRTC-P2P-333333?style=for-the-badge&logo=webrtc&logoColor=white)
  ![Gemini AI](https://img.shields.io/badge/GEMINI%20AI-FLASH-8B5CF6?style=for-the-badge&logo=google-gemini&logoColor=white)
  ![Cloudinary](https://img.shields.io/badge/CLOUDINARY-MEDIA-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

  <p align="center">
    Zenius AI is a premium, real-time e-learning and virtual classroom platform designed to deliver outstanding education experiences. Built with a robust MERN (MongoDB, Express, React, Node.js) architecture, it connects Students, Instructors, and Admins via tailormade control panels, real-time WebRTC audio/video streaming, cooperative whiteboard tools, and dynamic Google Gemini AI-driven study tools.
  </p>

  🔗 **Production Live Site**: [https://live-meet.onrender.com/](https://live-meet.onrender.com/)

</div>

---

## 🚀 Key Functional Modules

### 1. Interactive Live Classrooms (WebRTC & Socket.IO)
- **WebRTC P2P Rooms**: Virtual classrooms at `/live/:roomId` supporting video stream, microphone toggling, and screen sharing.
- **Synchronized Whiteboard**: Interactive collaborative whiteboard canvas synced in real-time across users using Socket.io.
- **Contextual Live Chat**: Instant classroom messages in sidebars.
- **Automatic Attendance Logs**: Records student entrance and departure timestamps automatically in database models.

### 2. Tailored Dashboards
- **Student Portal**:
  - Catalog browsing, course wishlists, and enrolling in up to 50 active courses.
  - Video lecture player with dynamic completion tracking.
  - **Dynamic Notes Tab & Redirect**: Notes-based lessons automatically redirect users to the Notes tab, displaying custom visitor layout components for external links.
  - Quizzes with on-screen utility calculators, notepad drafts, and feedback ratings to claim PDF certificates.
- **Instructor Portal**:
  - Drag-and-drop lecture outlines, course thumbnail updates, and description managers.
  - **Note Links & Files Builder**: Upload study notes (PDF, DOCX, TXT) or add external URL links to the curriculum outline.
  - Live session scheduling (WebRTC rooms or external URLs).
  - Student progress and grade charts.
- **Admin Portal**:
  - Manage all system users, suspend accounts, and approve/reject instructor applications.
  - Ticket support desk with accordion responses.
  - Dynamic page configuration using **Feature Flags** with graceful fallback views.

### 3. Google Gemini AI Integration
- **AI Quiz Builder**: Automatically creates MCQ quizzes from uploaded files (PDF, DOCX, TXT) using `gemini-2.5-flash`.
- **Background Extraction**: Offloads text extraction to async workers to ensure the Express thread remains un-blocked.

### 4. Advanced Security Measures
- **Double-Submit CSRF Cookies**: Custom token header validation mapping on state-changing API endpoints.
- **Brute Force Lockout**: Temporary 30-minute account ban after 5 consecutive failed passwords.
- **NoSQL SSRF & ReDoS Shields**: Escapes Mongo query selectors and validates resource link hosts during note uploading.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend (Client)** | React (v18), Vite (v6), Zustand, Tailwind CSS, Lucide Icons, Framer Motion, Socket.io-client, Recharts, HTML2Canvas, jsPDF |
| **Backend (Server)** | Node.js, Express, MongoDB (Mongoose), Socket.io, Helmet, CORS, Cookie Parser, bcryptjs, Multer, Nodemailer |
| **Obfuscation Engine** | `rollup-obfuscator` & `javascript-obfuscator` (Vite build time only) |

---

## 📁 Repository Structure

```
├── client/                  # Frontend SPA
│   ├── public/              # Static files (manifest, favicon, llms.txt)
│   ├── src/
│   │   ├── api/             # Axios API services
│   │   ├── components/      # Common components (Whiteboard, Quizzes)
│   │   ├── hooks/           # WebRTC and theme listeners
│   │   ├── pages/           # Views (auth, student, instructor, admin, legal)
│   │   ├── store/           # Zustand state configurations
│   │   └── utils/           # Time and unit formatters
│   └── vite.config.js       # Vite build configurations with Rollup obfuscator
│
├── server/                  # Backend REST API
│   ├── config/              # MongoDB and Cloudinary setups
│   ├── controllers/         # Request handling logic
│   ├── middleware/          # Rate limiting, CSRF, security filters
│   ├── models/              # Mongoose collection schemas
│   ├── routes/              # Express API endpoints
│   ├── services/            # Gemini AI, SMTP, and upload service layers
│   ├── socket/              # WebRTC & Whiteboard Socket.io handlers
│   └── index.js             # Main Express server bootstrapper & sitemaps
```

---

## ⚙️ Environment Configuration

Create a `.env` file at the project root directory:

```env
# ── Server Config ──
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ── Database ──
MONGO_URI=mongodb://localhost:27017/zenius-ai

# ── JWT Secrets ──
JWT_ACCESS_SECRET=your_32_character_access_secret_phrase
JWT_REFRESH_SECRET=your_32_character_refresh_secret_phrase

# ── Google Gemini AI ──
GEMINI_API_KEY=your_gemini_api_key_here

# ── Cloudinary ──
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ── Email (SMTP) ──
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

---

## 🏃 Running the Application Locally

### 1. Installation
Install dependencies in both folders:
```bash
# Install root tools
npm install

# Install client packages
cd client && npm install

# Install server packages
cd ../server && npm install
```

### 2. Launch Development Servers
From the project root directory, run:
```bash
npm run dev
```
- Client runs on: [http://localhost:5173](http://localhost:5173)
- Server runs on: [http://localhost:5000](http://localhost:5000)

### 3. Production Build & Obfuscation
To build and obfuscate the client code for production:
```bash
# Bundles and obfuscates client source files into client/dist/
npm run build
```

### 4. YouTube Data API v3 Setup
For automatic YouTube video title, duration, and thumbnail extraction:
- Set `YOUTUBE_API_KEY` in `server/.env` (and in your Render Environment Variables).
- Obtain a free API key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

---
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=7C3AED&height=120&section=footer&reversal=false" alt="Footer Wave" width="100%"/>
</p>
