# 🌌 CHRONOS 3D — Celestial Day-to-Day Life Scheduler & Gemini AI Copilot

An immersive, full-stack 3D interactive productivity workstation that helps users schedule their day-to-day life, track work pending vs work done with celestial analytics, trigger smart reminders, and resolve any doubts via an inbuilt **Google Gemini AI** companion.

Built with **Next.js (App Router)**, **Three.js**, **MongoDB Atlas**, **Web Audio API**, and **Google Gemini 2.5 Flash**. Fully optimized for 1-click deployment on **Vercel** and ready for **GitHub**.

---

## ✨ Features Breakdown

### 1. 🪐 Interactive 3D Celestial Core (Three.js)
- **Holographic Time Core**: Animated central nucleus with glowing crystalline wireframe cage and concentric orbital time rings.
- **3D Floating Task Nodes**: Every scheduled task orbits in 3D space, color-coded by priority and completion status (*Emerald = Done, Crimson = Urgent Pending, Amber = High, Cyan/Purple = Study/Work*).
- **Interactive Orbit & Raycasting**:
  - Click & drag to rotate orbital view (pitch and yaw).
  - Mouse scroll to zoom in and out.
  - Hover over any 3D node to inspect title, time, priority, and progress.
  - Click any 3D node to focus and open its management drawer.
- **Dynamic Starfield Nebula**: 1,200 particle stardust galaxy reacting smoothly to user interactions.

### 2. 🗓️ Day-to-Day Life Scheduler & Pending vs Done Analytics
- **Hour-by-Hour Timeline**: Clean schedule blocks (06:00 to 23:00) with date navigation and date picker.
- **Progress Gauge**:
  - Circular SVG progress ring displaying exact Completion Velocity (0 - 100%).
  - Metric cards for **Work Completed** vs **Work Pending** with estimated hours/minutes needed.
  - Urgent bottlenecks radar and productivity streaks.
- **Sub-tasks Checklist**: Break any task down into micro-steps with individual progress tracking.
- **Celebration Effects**: Confetti burst (`canvas-confetti`) and celestial arpeggio chimes (`Web Audio API`) when completing tasks.

### 3. ⏰ Active Reminder Notification Engine
- **Configurable Alarms**: Trigger alerts at the time of the event, 5 min, 15 min, 30 min, or 1 hour before.
- **Desktop & In-App Alerts**: Native HTML5 Browser Desktop Notifications + Cyber-HUD toast with **Mark as Done** and **Snooze 5m** buttons.
- **Procedural Audio Chimes**: Dual-tone radar alert generated in real time using the browser's Web Audio API.

### 4. 🧠 Inbuilt Google Gemini AI ("Chronos AI")
- **Ask Any Doubt**: Students and professionals can ask any academic, technical, or life habits doubt directly in the app.
- **Schedule Day Architect**: Prompt Gemini (*"Plan my day from 9 AM to 6 PM with 3 study blocks and workout"*) to generate an optimal routine.
- **Task Auto-Breakdown**: One-click AI decomposition takes any complex task and breaks it into 3-5 actionable sub-tasks.
- **Context Awareness**: Chronos AI knows how many tasks you have pending and motivates you with strategic prioritization (e.g. Eisenhower matrix).
- **Zero-Config Fallback**: Features a built-in smart assistant engine so the app works immediately out of the box even before entering an API key.

### 5. 👥 Multi-User Authentication & MongoDB Database
- **Multi-User Ready**: User registration and login with bcrypt password hashing and JWT authentication tokens.
- **MongoDB Atlas Integration**: Native MongoDB connection pooling optimized for Next.js serverless functions on Vercel.
- **Local-First Fallback**: Works offline/locally with browser storage sync and transitions to MongoDB Atlas cloud sync seamlessly when configured.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/chronos3d?retryWrites=true&w=majority
JWT_SECRET=your-secure-random-jwt-secret
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗄️ Setting Up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a new **M0 Free Cluster**.
3. Under **Database Access**, create a database user (e.g., `chronos_admin` and a strong password).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere (`0.0.0.0/0`)** (required for Vercel serverless functions).
5. Click **Connect** -> **Drivers** -> Copy the connection string.
6. Paste the connection string into `MONGODB_URI` in `.env.local` (and into Vercel Environment Variables).

---

## 🔑 Getting Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. Copy your key and paste it into `GEMINI_API_KEY` in `.env.local` or enter it directly into the Chronos AI modal settings in the web UI.

---

## 🐙 Publishing to GitHub

To make a GitHub repository for this project:

```bash
# 1. Initialize and add files (if not already done)
git add .
git commit -m "feat: complete 3D day-to-day scheduler with Gemini AI, reminders, and MongoDB multi-user support"

# 2. Create a new repository on https://github.com/new (e.g., chronos-3d-scheduler)

# 3. Link remote and push:
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

---

## ☁️ Deploying to Vercel

1. Push your code to your GitHub repository (see steps above).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
3. Select your GitHub repository (`chronos-3d-scheduler`).
4. In the **Environment Variables** section, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: A secure random secret string
   - `GEMINI_API_KEY`: Your Google Gemini API key
5. Click **Deploy**.
6. Vercel will build and deploy your site in ~45 seconds with a live global HTTPS URL!

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions & Route Handlers)
- **3D Graphics**: [Three.js](https://threejs.org/) (WebGL Canvas, Shaders, Raycasting)
- **Styling**: Vanilla CSS Design System with Cyber-Celestial Glassmorphism
- **Database**: [MongoDB](https://www.mongodb.com/) (Native Driver & Connection Pooling)
- **Artificial Intelligence**: [Google Gemini 2.5 Flash](https://ai.google.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio Engine**: Procedural Web Audio API (Zero external assets required)
- **Celebration FX**: Canvas Confetti

---

## 📄 License
MIT License. Created for high-performance day-to-day life scheduling.
