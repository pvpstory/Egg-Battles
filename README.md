# 🥚 Egg Battles

**Egg Battles** is an Easter-themed mobile mini-game designed to be integrated inside **PKO Bank Polski's** mobile app. The game offers a socialising experience, a rewards track, and customisation. It's designed to help PKO Bank Polski acquire new young clients through a viral referral loop, where existing users invite friends who must open an account to join the game, as well as keep existing young clients engaged.

> [!NOTE]
> This is a **demonstration app** created for showcase purposes. The core gameplay loop and matchmaking flow are fully functional as a prototype.

---

## 📱 Features

- **Egg Clash Battles** — Turn-based 1v1 gameplay where players choose attack and defense positions to crack their opponent's egg
- **Customisation** — Collect and equip eggs of different rarities (Common, Rare, Legendary)
- **Rewards Track** — Progress through milestones to earn Golden Feathers and open Chests
- **Shop** — Spend Golden Feathers on real-world rewards (Spotify, Sweet.tv, BookBeat, and more)
- **Leaderboards** — Local and Global rankings to compete with friends and the community
- **Matchmaking** — Real-time opponent discovery via WebSocket-based backend

---

## 🤝 How it Works (Matchmaking)

Egg Battles uses a proximity-based matchmaking system designed for social interaction:

1. **Open the Game**: Two players open the PKO Bank Polski app and enter the Egg Battles mini-game.
2. **Search for Opponents**: Both players tap "Find Opponent" to enter the matchmaking queue.
3. **Physical Interaction**: Players stand close to each other and **shake their phones simultaneously**.
4. **Proximity Matching**: Using Bluetooth/GPS data (simulated in this demo), the backend matches the two friends together for a 1v1 battle.
5. **Battle**: The game begins immediately once the handshake is confirmed.

---

## 🏗️ Project Structure

```
Easter-egg/
├── backend/              # Python FastAPI + Socket.IO server
│   ├── main.py           # Server entry point
│   ├── game_logic.py     # Game manager and matchmaking logic
│   ├── requirements.txt  # Python dependencies
│   └── test_client.py    # Test client for backend
├── frontend/
│   └── Easter-eggs/      # React Native (Expo) mobile app
│       ├── app/           # Screens (tabs, game, battle)
│       ├── hooks/         # Game logic hooks (battle, mock opponent)
│       ├── assets/        # Images, icons, game assets
│       └── package.json   # Node.js dependencies
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **Python** (3.10 or later)
- **Expo CLI** — installed globally or via `npx`
- **iOS Simulator** (Xcode) or **Android Emulator** (Android Studio), or the **Expo Go** app on a physical device

### Backend(no need for demonstration)

1. Navigate to the backend directory:
   ```bash
   cd Easter-egg/backend
   ```

2. Create and activate a virtual environment (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload
   ```

   The server will be available at `http://localhost:8000`.

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd Easter-egg/frontend/Easter-eggs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the app:
   ```bash
   # For iOS Simulator
   npm run ios

   # For Android Emulator
   npm run android

   # For Web
   npm run web

   # Or start Expo dev server and choose platform
   npm start
   ```

4. If using a **physical device**, install the [Expo Go](https://expo.dev/go) app and scan the QR code shown in the terminal.

---

## 🛠️ Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React Native, Expo, Expo Router     |
| Backend  | Python, FastAPI, Socket.IO          |
| Animations | React Native Reanimated          |
| Navigation | Expo Router, React Navigation    |

---

## 📄 License

This project was built as part of a hackathon.
