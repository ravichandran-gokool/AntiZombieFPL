# AntiZombieFPL

Core features: Notifications

Frontend
Authentification

Read info from game
1. seeing performance and compare
2. check injured players
3. find good time to play chip

Notifications

Backend
Database

/fpl-annoyer (Root)
├── /frontend          # React Native (Expo)
│   ├── /src/auth      # Auth logic (Teammate 1)
│   ├── /src/game      # FPL API calls/Team view (Teammate 2)
│   └── /src/notify    # Notification handlers (Teammate 3)
├── /backend           # Python (FastAPI)
│   ├── main.py        # API Routes
│   ├── fpl_logic.py   # Calculations (Injuries, Rank, Roasts)
│   └── database.py    # Supabase connection
├── .env               # Your API keys (Do NOT commit this)
└── README.md