# Live-Meet 🎥🎓

Welcome to **Live-Meet**, a collaborative, real-time live classroom and meeting platform. This application features role-based access for Admins, Teachers, and Students, complete with live streams/sockets, AI-generated material (via Google Gemini), and interactive classrooms.

---

## 🚀 Features

- **Real-time Collaboration**: Powered by Express, Socket.io, and React.
- **Role-based Authentication**: Secure access for Admins, Teachers, and Students.
- **Interactive Dashboards**: Tailored views for managing classes, viewing recordings, and participating in live sessions.
- **AI Integration**: Automatic quiz/MCQ generation using Google Gemini AI.

---

## 🛠️ Tech Stack

- **Frontend**: React, React Router Dom, TailwindCSS, Socket.io-client, Vite
- **Backend**: Express, Node.js, MongoDB (Mongoose), Socket.io, BullMQ (Queue management)
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`)

---

## ⚙️ Getting Started

Follow these steps to set up and run the application locally.

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)
- [Redis](https://redis.io/) (Optional, required for BullMQ queues if you use heavy backend processing)

### 2. Installation
Dependencies have been installed at the root and frontend directories. If you need to re-install them in the future, run:
```bash
# Install backend dependencies (from project root)
npm install

# Install frontend dependencies (from project root)
cd frontend
npm install
```

### 3. Environment Setup
Both the frontend and backend require local environment variables. Template files have been created for you:

#### Backend Config:
1. Navigate to the `backend` folder.
2. Copy `.env.example` and rename it to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Open `backend/.env` and update the values:
   - `MONGO_URI`: Your MongoDB connection string (e.g. `mongodb://localhost:27017/live-meet`)
   - `JWT_SECRET`: A secure key for signing login sessions.
   - `GEMINI_API_KEY`: Your Google Gemini API Key.

#### Frontend Config:
1. Navigate to the `frontend` folder.
2. Copy `.env.example` and rename it to `.env`:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
3. Check `frontend/.env` is set correctly (default: `VITE_API_URL=http://localhost:5000`).

---

## 🏃 Running the Application

To run the application, you need to start the backend and frontend servers.

### Start the Backend (API Server)
From the root directory, run:
```bash
npm start
```
*The server will run on `http://localhost:5000` (or the port defined in your `.env` file).*

### Start the Frontend (Vite Dev Server)
From the `frontend` directory, run:
```bash
npm run dev
```
*The app will run on `http://localhost:5173` (or the port Vite selects).*

---

## 🤝 Collaboration Guide for You & Your Friend

Since you are collaborating, here is how you can manage your work using Git:

### 1. Keep your main branch updated
Before starting work on a new feature, make sure your local repository is up to date:
```bash
git checkout main
git pull origin main
```

### 2. Work in feature branches
Instead of editing the `main` branch directly, create a branch for every feature or fix:
```bash
git checkout -b feature/your-feature-name
```

### 3. Commit and push your changes
Write descriptive commit messages and push your branch to GitHub:
```bash
git add .
git commit -m "feat: add real-time classroom chat"
git push origin feature/your-feature-name
```

### 4. Create Pull Requests (PRs)
Go to GitHub, create a Pull Request from your feature branch to `main`, and ask your friend to review and approve the changes!
