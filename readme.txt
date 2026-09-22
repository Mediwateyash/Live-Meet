================================================================================
                    ZENIUS AI — LIVE-MEET PLATFORM
                     Windows Setup & Run Guide
================================================================================

PREREQUISITES:
1. Node.js (v18 or higher) -> https://nodejs.org/

--------------------------------------------------------------------------------
STEP-BY-STEP INSTRUCTIONS:
--------------------------------------------------------------------------------

STEP 1: EXTRACT THE ZIP
1. Right-click the zip file -> Select "Extract All...".
2. Open the extracted folder in VS Code or PowerShell / Command Prompt.

STEP 2: INSTALL DEPENDENCIES
Open terminal in the project root folder and run:
   npm install
   cd client && npm install
   cd ..\server && npm install
   cd ..

STEP 3: SEED DEMO DATA (OPTIONAL / RECOMMENDED)
To create demo courses and test accounts, run:
   npm run seed --prefix server

STEP 4: START THE APPLICATION
From the project root folder, run:
   npm run dev

- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

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
