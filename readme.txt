================================================================================
                    SMIT — SANDEEP MORE INSTITUTE OF TECHNOLOGY
                      Windows Quick Setup Guide
================================================================================

ABOUT THE PROJECT:
Sandeep More Institute of Technology (SMIT) is a virtual classroom & LMS platform
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
Description: You can start the app using either Method 1 or Method 2 below:

--- METHOD 1: Single Command from Root (Recommended) ---
Run directly in the project root folder:
   npm run dev

   (This automatically starts both Backend and Frontend together!)

--- METHOD 2: Using Two Separate Terminals ---
Terminal 1 (Backend):
   cd server
   npm run dev

Terminal 2 (Frontend):
   cd client
   npm run dev


- Frontend URL: http://localhost:5173
- Backend API:  http://localhost:5000

Open your browser and visit: http://localhost:5173

--------------------------------------------------------------------------------
DEMO LOGIN CREDENTIALS:
--------------------------------------------------------------------------------
ROLE          | EMAIL                 | PASSWORD
--------------+-----------------------+-----------------
Admin         | admin@smit.edu        | Admin@2026
Instructor    | yash@gmail.com        | Instructor@2026
Student       | student1@smit.edu     | Student@2026

================================================================================
