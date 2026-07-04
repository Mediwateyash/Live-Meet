# Zenius AI (Live-Meet) 🎥🎓

<div align="center">

  ![Node.js](https://img.shields.io/badge/NODE.JS-18%2B-green?style=for-the-badge&logo=node.js&logoColor=white)
  ![React](https://img.shields.io/badge/REACT-18-blue?style=for-the-badge&logo=react&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MONGODB-6%2B-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Socket.io](https://img.shields.io/badge/SOCKET.IO-4%2B-010101?style=for-the-badge&logo=socket.io&logoColor=white)
  ![Gemini AI](https://img.shields.io/badge/GEMINI%20AI-FLASH-8B5CF6?style=for-the-badge&logo=google-gemini&logoColor=white)
  ![BullMQ](https://img.shields.io/badge/BULLMQ-REDIS-FF6600?style=for-the-badge&logo=redis&logoColor=white)

  <p align="center">
    Zenius AI (Live-Meet) is a state-of-the-art, real-time interactive e-learning, live classroom, and meeting platform. Featuring custom dashboards for Students, Instructors, and Admins, the platform enables rich real-time communication, course building, AI-powered study material extraction, and automated interactive quiz grading.
  </p>

  🔗 **Live Deployment URL**: [https://live-meet.onrender.com/](https://live-meet.onrender.com/)

</div>

---

## 🚀 Key Features

### 1. Interactive Live Classrooms (WebRTC & WebSockets)
- **Built-in Live Rooms**: Real-time virtual classrooms at `/live/:roomId` supporting camera streaming, microphone sharing, and screen sharing.
- **Interactive Whiteboard & Chat**: Real-time canvas whiteboard collaboration alongside a high-performance instant chat interface powered by **Socket.io**.
- **Attendance Tracking**: Automated entry recording and attendance logs generated for course lectures.

### 2. Multi-Role Tailored Dashboards
- **Student Dashboard**: 
  - Browse featured courses, wishlist items, and enroll in up to 50 courses.
  - Access structured video players, track lesson progression, and download official PDF certificates upon course completion.
  - Take quizzes with on-screen utility calculators and notepad tools.
- **Instructor Dashboard**:
  - Full-featured course builder (drag-and-drop lecture arranging, thumbnail uploading, description writing).
  - Class scheduler to set up WebRTC rooms or custom URLs.
  - Automated MCQ builder with AI generation tools.
  - Student progress and grading charts.
- **Admin Dashboard**:
  - Manage all system users, suspend accounts, and approve/reject instructor applications.
  - Centralized customer support ticketing system with accordion-style message replies.
  - Platform-wide statistics (course counts, active students, revenue charts).

### 3. Gemini AI Multimodal Processing
- **AI Quiz Generation**: Integrates the **Google Generative AI SDK** (using `gemini-2.5-flash`) to generate structured MCQ quizzes automatically from uploaded course files (PDFs, DOCX, and PPTX).
- **Background Parsing**: Multi-stage parsing queues that extract questions, answers, and study notes from raw document attachments.

### 4. Enterprise-Grade Security Remediations
- **Clickjacking & CSP Protection**: Strict Content Security Policy (CSP) and double-click framing protection configured globally using Helmet headers.
- **Double-Submit CSRF Cookies**: Custom token header validation mapping on state-changing API endpoints.
- **Brute Force Lockout**: Accounts locked for 30 minutes after 5 consecutive failed login attempts.
- **ReDoS Mitigation**: Strict sanitization of user search strings to escape special characters before Mongoose query processing.
- **SSRF Shields**: Allowed-host checks and connection timeouts on external URL fetches.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend (Client)** | React (v18), Vite, Tailwind CSS, Lucide Icons, Framer Motion, Socket.io-client, Recharts, HTML2Canvas, jsPDF |
| **Backend (Server)** | Node.js, Express, MongoDB (Mongoose), Socket.io, Helmet, CORS, Cookie Parser, bcryptjs, Multer, Nodemailer, BullMQ, Redis |
| **AI Processing** | Google Generative AI SDK (`@google/generative-ai`) |

---

## ⚙️ Environment Configuration

To run Zenius AI locally, set up the environment variables in a root `.env` file (which is loaded or copied to sub-modules as needed).

### Root `.env` Configuration
Create a `.env` file at the root:

```env
# ── Server Config ──
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ── Database ──
MONGO_URI=mongodb://localhost:27017/zenius-ai

# ── Redis / Queue ──
REDIS_HOST=localhost
REDIS_PORT=6379

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
Install root, client, and server dependencies:
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
*This command concurrently starts the nodemon API server (at `http://localhost:5000`) and the Vite frontend dev server (at `http://localhost:5173`).*

---

## 📦 Production Builds

To compile and bundle the React frontend application for production:
```bash
# Build the client production assets
npm run build
```
The compiled files will be output to the `client/dist` directory. To start the production API service:
```bash
npm start
```

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=10B981&height=120&section=footer&reversal=false" alt="Footer Wave" width="100%"/>
</p>
