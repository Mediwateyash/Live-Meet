# Zenius AI 🎥🎓

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
    Zenius AI is a modern, real-time e-learning and virtual classroom platform designed to deliver interactive education experiences. Built with a robust MERN (MongoDB, Express, React, Node.js) architecture, it connects Students, Instructors, and Admins via tailormade control panels, real-time WebRTC audio/video streaming, collaborative tools, and Gemini AI-driven study tools.
  </p>

  🔗 **Live Deployment URL**: [https://live-meet.onrender.com/](https://live-meet.onrender.com/)

</div>

---

## 🚀 Key Features

### 1. Interactive Live Classrooms
- **WebRTC Live Rooms**: Real-time virtual classrooms at `/live/:roomId` supporting camera streaming, microphone sharing, and screen sharing.
- **Collaborative Whiteboard & Chat**: Real-time whiteboard canvas collaboration alongside an instant chat interface powered by **Socket.io**.
- **Attendance Logs**: Automatically records classroom joining and departure times.

### 2. Multi-Role Tailored Dashboards
- **Student Dashboard**: 
  - Browse featured courses, wishlist items, and enroll in up to 50 courses.
  - Access structured video players, track lesson progression, and download official PDF certificates upon course completion.
  - **Auto-Switching Notes Hub**: Text-based lessons automatically direct the student to the Notes tab, displaying custom visitor layout components for external resource links.
  - Take quizzes with on-screen utility calculators and notepad tools.
- **Instructor Dashboard**:
  - Full-featured course builder (drag-and-drop lecture arranging, thumbnail uploading, description writing).
  - **Dynamic Notes Organizer**: Upload study notes files (PDF, DOCX, TXT) or add external URL links to the lesson curriculum.
  - Class scheduler to set up WebRTC rooms or custom URLs.
  - Automated MCQ builder with AI generation tools.
  - Student progress and grading charts.
- **Admin Dashboard**:
  - Manage all system users, suspend accounts, and approve/reject instructor applications.
  - Centralized customer support ticketing system with accordion-style message replies.
  - Centralized dashboard control panel showing user counts, active courses, and revenue.

### 3. Gemini AI Multimodal Processing
- **AI Quiz Generation**: Integrates the **Google Generative AI SDK** (using `gemini-2.5-flash`) to generate structured MCQ quizzes automatically from uploaded course files (PDFs, DOCX, and PPTX).
- **Background Extraction**: Asynchronously extracts core concepts and details without blocking main server processing thread tasks.

### 4. Admin Feature Flags
- **Dynamic Configuration**: Admin settings page to toggle page visibility on-the-fly.
- **Graceful Fallbacks**: Beautiful fallback views displayed when a page or document is disabled by administrators.

### 5. Enterprise-Grade Security Remediations
- **Clickjacking & CSP Protection**: Strict Content Security Policy (CSP) and double-click framing protection configured globally using Helmet headers.
- **Double-Submit CSRF Cookies**: Custom token header validation mapping on state-changing API endpoints.
- **Brute Force Lockout**: Accounts locked for 30 minutes after 5 consecutive failed login attempts.
- **ReDoS Mitigation**: Strict sanitization of user search strings to escape special characters before Mongoose query processing.
- **SSRF Shields**: Allowed-host checks and connection timeouts on external URL fetches.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend (Client)** | React (v18), Vite, Zustand (State Management), Tailwind CSS, Lucide Icons, Framer Motion, Socket.io-client, Recharts, HTML2Canvas, jsPDF |
| **Backend (Server)** | Node.js, Express, MongoDB (Mongoose), Socket.io, Helmet, CORS, Cookie Parser, bcryptjs, Multer, Nodemailer |
| **AI Processing** | Google Generative AI SDK (`@google/generative-ai`) |

---

## 📁 Repository Structure

```
├── client/          # React frontend (Vite, Tailwind CSS, Lucide Icons, Framer Motion)
├── server/          # Node.js Express backend API (Mongoose schemas, socket handlers)
├── package.json     # Root dependency orchestration scripts
└── README.md        # Documentation
```

---

## ⚙️ Environment Configuration

To run Zenius AI locally, set up a `.env` file at the root directory of the project:

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

You can run the frontend client and backend server concurrently from the root directory.

### 1. Installation
Install dependencies in both client and server:
```bash
# Install root orchestration tools
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
*This command concurrently starts the backend server (at `http://localhost:5000`) and the Vite React frontend dev server (at `http://localhost:5173`).*

---

## 📦 Production Builds

To compile the React frontend application for production deployment:
```bash
# Build the client production assets
npm run build
```
The compiled files will be output to `client/dist`. To start the production API service:
```bash
npm start
```

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=10B981&height=120&section=footer&reversal=false" alt="Footer Wave" width="100%"/>
</p>
