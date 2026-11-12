# 🃏 CABO Online – Complete Card Game

A real-time multiplayer card game based on the complete rules of **CABO**, cleanly separated into **`frontend/`** (React + Vite) and **`backend/`** (Node.js + Express + Socket.IO).

---

## 📁 Project Architecture

```
cabo-game/
├── frontend/             # Modern React + Vite frontend (Deploy to Vercel)
│   ├── src/
│   │   ├── components/   # Card, PlayerPanel, CenterTable, ActionBar, RulesModal, ResultsModal, Lobby
│   │   ├── utils/        # Web Audio synthesizer & constants
│   │   ├── styles/       # Luxury casino felt styles & animations
│   │   ├── App.jsx       # Real-time state manager
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
│
├── backend/              # Authoritative game engine & WebSockets (Deploy to Render / Railway / VPS)
│   ├── server.js         # Full authoritative rules engine & room management
│   ├── test-cabo.js      # Automated unit test suite
│   └── package.json
│
├── package.json          # Root scripts to orchestrate frontend & backend
├── vercel.json           # Vercel configuration mapping build to frontend/dist
├── .gitignore
└── README.md
```

---

## 🎮 Complete Game Rules Implemented

1. **Objective**: Minimize total card value in front of you. Lowest total score wins (negative scores allowed).
2. **Setup**: 4 cards dealt face down in a **2×2 grid**:
   - **Top row**: Unknown cards.
   - **Bottom row**: Secretly memorized at the start of the round.
3. **Card Values**:
   - **Red King (Hearts ♥, Diamonds ♦)**: **-1** (Best card in the game!)
   - **Ace**: **1**
   - **2 to 10**: Face value (**2–10**)
   - **Jack**: **11**
   - **Queen**: **12**
   - **Black King (Spades ♠, Clubs ♣)**: **13**
4. **Turn Structure**: Draw 1 card from deck:
   - **Option A (Replace)**: Swap any of your cards with the drawn card.
   - **Option B (Use Power)**: Discard drawn card face up to use its special power (7/8 own, 9/10 other, Jack blind swap, Queen peek & swap, King peek both & swap).
5. **Anytime Matching Rule**:
   - Discarding own matching numerical value reduces your hand score.
   - Discarding an opponent's matching card transfers 1 of your cards to them as compensation.
   - Wrong match penalty: keep card + draw **1 penalty card** from deck.
   - First-come, first-served per discard opportunity.
6. **Calling CABO & Card Locking**:
   - Calling CABO locks the caller's cards from changes (cannot be swapped with Jack/Queen/King, replaced, or discarded by opponents).
   - Other players **can still peek** at the CABO caller's cards with 9/10, Queen, or King.
   - Every other player gets exactly **one final turn**.
   - **⭐ Caller's Final Opportunity Window**: The turn returns to the CABO caller for one final opportunity to discard own matching cards before the final reveal!
7. **Final Reveal**: All hands revealed; lowest score wins. Ties share the victory.

---

## 🚀 Local Development

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Run Tests
```bash
npm test
# Or: cd backend && npm test
```

### 3. Run Development Servers
```bash
# Terminal 1: Start backend server (port 3000)
npm run dev:backend

# Terminal 2: Start React frontend with Vite hot-reload (port 5173)
npm run dev:frontend
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploy Frontend to Vercel

The `frontend/` directory is built with **React + Vite**. The repository root has a Vercel configuration that builds it from the monorepo.

1. Push your repository to **GitHub**.
2. Go to [Vercel.com](https://vercel.com) and click **Add New Project**.
3. Select this GitHub repository.
4. In Project Settings, set **Root Directory** to the repository root (leave “Include files outside the root directory” enabled if shown). This uses the root `vercel.json`.
5. Use these build settings if Vercel asks for them:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm --prefix frontend run build`
   - **Output Directory**: `frontend/dist`
6. In **Environment Variables**, add:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: Your deployed backend URL (e.g. `https://your-cabo-backend.onrender.com`)
7. Click **Deploy**. Vercel provides your frontend HTTPS URL.

> **💡 In-Game Server Switcher:** Players can also enter or switch the backend server URL directly on the lobby screen by clicking the **Server** button.

---

## 🖥️ Deploy Backend (WebSockets)

Because Vercel serverless functions do not maintain long-lived WebSocket connections, host the lightweight Node server on any of the following platforms:

1. Push the repository to GitHub.
2. In [Render](https://render.com), choose **New + > Web Service**, then connect the repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Language**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Create the service. Once it deploys, open `https://YOUR-SERVICE.onrender.com/health`; it should show `ok`. Copy the service URL (no `/health`).
5. In Vercel, open the project’s **Settings > Environment Variables** and set `VITE_BACKEND_URL` to the Render URL, for example `https://your-cabo-backend.onrender.com`.
6. Redeploy the Vercel project so the frontend build picks up the environment variable.
7. Open the Vercel site and create a room to confirm the Socket.IO connection works.

The backend stores rooms in memory, so active rooms are lost if Render restarts or sleeps the service. Players also need the same backend service URL to join the same rooms.
