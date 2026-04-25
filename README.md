<div align="center">

# 🌿 Biome

### _Build your own world, one focus session at a time._

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron)](https://www.electronjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev)

</div>

---

## What is Biome?

Biome is a **world-building productivity app** for desktop and mobile. Stay focused during your work sessions to earn trees, flowers, and rare items — then manually place them wherever you want to grow your own living ecosystem.

Unlike apps that just plant a generic tree and move on, Biome gives you full creative control. Your world is yours to design.

> **Inspired by** the idea that deep work should leave a tangible, beautiful trace in your life.

---

## ✨ Features

### 🌍 Your World, Your Rules
- Complete a focus session → earn a plant or item in your **Inventory**
- Open **My Biome** → select an item → place it exactly where you want on the grid
- **Territory Expansion** — fill all tiles with living items and your world grows 1.75× in size

### ⏱️ Focus Timer
- Pomodoro-style timer with customizable durations (5–120 minutes)
- 5 ambient soundscapes: Rain, Forest, Ocean, Cafe, Fireplace
- Give up a session → a withered shrub drops as a penalty (placed automatically)
- Item rarity system: Common → Rare → Epic → Legendary

### 📅 Daily Planner + Timeline
- Add tasks by day with categories (Work, Study, Health, Creative, Code...)
- Calendar heatmap (GitHub-style) showing focus history for the whole month
- Navigate between days with the date strip — past days are read-only

### 🔥 Streaks & Progression
- XP system with levels (Forest Ranger → Ancient Guardian)
- Daily streak tracking with streak freeze mechanic
- 30+ achievements to unlock across all features
- Weekly and monthly challenges

### 🏆 Real-Time Leaderboard
- Live global rankings powered by Firebase Firestore
- Compete on weekly focus minutes
- Shows streak, level, and forest size for all players

### ☁️ Cross-Device Sync (Google Auth)
- Sign in with Google — your biome syncs across desktop + phone
- Auto-saves every 3 seconds to Firestore
- Works offline (PWA-ready with service worker)

### 📱 Progressive Web App (PWA)
- Full mobile-responsive UI with custom glassmorphic bottom navigation bar
- Add to Home Screen on iOS (Safari) and Android (Chrome)
- Seamless offline support with Service Workers
- Fluid grid layouts and safe-area adjustments for modern phone displays

### 🖥️ Desktop-First (Electron)
- Custom frameless window with native title bar controls
- **Floating Mini Widget** — when minimized, a small glass overlay shows your live timer countdown
- System tray with quick-start shortcuts
- Global shortcut: `Ctrl+Shift+F` to bring the app to focus

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Git | any |
| A Firebase project | [Setup guide below](#firebase-setup) |

### 1. Clone the repo

```bash
git clone https://github.com/devantaris/Biome.git
cd Biome
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Copy the environment example and fill in your Firebase config:

```bash
cp .env.example .env
```

Then open `src/lib/firebase.ts` and replace the `firebaseConfig` object with your own values from the [Firebase console](https://console.firebase.google.com):

```ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 4. Run in the browser (dev mode)

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 5. Run as a desktop app (Electron)

```bash
npm run dev:electron
```

This starts both the Vite dev server and Electron simultaneously.

---

## Firebase Setup

> **Required** for Google Sign-In and cross-device sync.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it anything
2. **Authentication** → Get started → Enable **Google** sign-in
3. **Firestore Database** → Create database → Start in production mode
4. Set **Firestore Security Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /leaderboard/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. **Project settings** → Add a **web app** → Copy the `firebaseConfig` → paste into `src/lib/firebase.ts`

---

## 📁 Project Structure

```
Biome/
├── electron/                   # Electron main process
│   ├── main.cjs                # Window, tray, widget, IPC handlers
│   ├── preload.cjs             # Context bridge (exposed to React)
│   ├── widget.html             # Floating mini-timer UI
│   └── widget-preload.cjs     # Widget context bridge
│
├── public/                     # Static assets
│   ├── favicon.svg
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker (offline)
│
├── src/
│   ├── components/             # React UI components
│   │   ├── AuthGate.tsx        # Google sign-in landing page
│   │   ├── Dashboard.tsx       # Home dashboard with stats
│   │   ├── Timer.tsx           # Focus timer UI
│   │   ├── ForestView.tsx      # The world builder (placement mode)
│   │   ├── TaskManager.tsx     # Daily task manager with date strip
│   │   ├── Calendar.tsx        # Monthly heatmap timeline
│   │   ├── Leaderboard.tsx     # Global rankings
│   │   ├── Achievements.tsx    # 30+ badges
│   │   ├── Challenges.tsx      # Weekly/daily challenges
│   │   ├── Settings.tsx        # App preferences + logout
│   │   ├── Sidebar.tsx         # Navigation + user profile
│   │   ├── Onboarding.tsx      # First-run welcome
│   │   └── TitleBar.tsx        # Custom frameless window controls
│   │
│   ├── hooks/
│   │   ├── useAppState.ts      # Central state management (localStorage)
│   │   ├── useTimer.ts         # Timer logic, earn items, penalties
│   │   ├── useAuth.ts          # Firebase Google auth hook
│   │   └── useCloudSync.ts     # Firestore auto-sync hook
│   │
│   ├── lib/
│   │   ├── firebase.ts         # Firebase init ← PUT YOUR CONFIG HERE
│   │   ├── firestore.ts        # Firestore read/write/leaderboard
│   │   ├── achievements.ts     # Achievement definitions
│   │   ├── analytics.ts        # Streak, XP, session analytics
│   │   ├── leaderboard.ts      # Leaderboard generation
│   │   └── sounds.ts           # Web Audio ambient sound engine
│   │
│   ├── types.ts                # All TypeScript interfaces
│   ├── constants.ts            # Items, INITIAL_STATE, game config
│   ├── App.tsx                 # Root app with routing
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles + design tokens
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── electron-builder.yml        # Desktop build config
└── package.json
```

---

## 🛠️ Scripts

```bash
npm run dev              # Start Vite dev server (browser)
npm run dev:electron     # Start Vite + Electron together
npm run build            # Production web build
npm run build:electron   # Build + package desktop app (.exe / .dmg)
npm run lint             # TypeScript type check
npm run clean            # Remove build artifacts
```

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |
| Desktop | Electron 33 |
| Build Tool | Vite 6 |
| Auth | Firebase Authentication (Google) |
| Database | Cloud Firestore |
| Offline | PWA + Service Worker |
| State | React hooks + localStorage (with Firestore sync) |
| Audio | Web Audio API (procedural ambient sounds) |

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native / Capacitor) sharing the same Firebase backend
- [ ] Custom item catalog / marketplace
- [ ] Collaborative forests (shared biomes with friends)
- [ ] Biome themes (desert, arctic, ocean floor)
- [ ] Widgets for iOS/Android home screen live timer
- [ ] AI-powered focus coach suggestions

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Made with focus 🌿
</div>
