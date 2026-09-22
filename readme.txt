================================================================================
                    ZENIUS AI — LIVE-MEET PLATFORM
                      Windows Quick Setup Guide
================================================================================

ABOUT THE PROJECT:
Zenius AI (Live-Meet) is a real-time virtual classroom & e-learning platform
featuring WebRTC live rooms, interactive whiteboards, and AI-powered quizzes.

PREREQUISITE:
- Node.js (v18 or higher) -> Download from https://nodejs.org/

--------------------------------------------------------------------------------
STEP-BY-STEP INSTRUCTIONS:
--------------------------------------------------------------------------------

STEP 1: EXTRACT THE ZIP FILE
Description: Unpack the project files to any folder on your computer.
1. Right-click the zip file -> Select "Extract All...".
2. Open the extracted folder in VS Code, Terminal, or PowerShell.


STEP 2: INSTALL DEPENDENCIES
Description: Installs all required libraries for the root, frontend, and backend.
Open PowerShell / Command Prompt in the project root folder and run:

   npm install
   cd client && npm install
   cd ..\server && npm install
   cd ..


STEP 3: SEED DEMO DATA (OPTIONAL / RECOMMENDED)
Description: Populates the database with sample courses, students, and instructors.
Run this command from the project root folder:

   npm run seed --prefix server


STEP 4: START THE APPLICATION
Description: Launches both frontend and backend servers simultaneously.
Run this command from the project root folder:

   npm run dev

- Frontend URL: http://localhost:5173
- Backend API:  http://localhost:5000

Open your browser and visit: http://localhost:5173

--------------------------------------------------------------------------------
DEMO LOGIN CREDENTIALS:
--------------------------------------------------------------------------------
ROLE          | EMAIL                 | PASSWORD
--------------+-----------------------+-----------------
Admin         | admin@zenius.ai       | Admin@2026
Instructor    | yash@gmail.com        | Instructor@2026
Student       | student1@zenius.ai    | Student@2026

================================================================================
