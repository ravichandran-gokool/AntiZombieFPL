# 🧟 FPL Nagbot

> **Don't let your Fantasy Premier League team rot.** > An annoyed AI assistant that shames you into managing your team.

## 💡 The Problem
You start the FPL season strong, but life gets busy. You miss one deadline, then two, and suddenly your team is full of injured players. You give up, and your ranking goes to hell.

## 🚀 What we built
**FPL Caretaker** is a mobile app designed for the casual fan. It doesn't just show stats; it **harasses** you until you fix your team.

* **🚑 Injury Watchdog:** Automatically scans your Starting XI for injuries.
* **📢 Shame Notifications:** If your rank drops or players are injured, the app sends bombards you with notifications.
* **🤖 AI Roast Master:** Uses OpenAI to generate personality-driven insults based on your specific team's failures.

### Prerequisites
* Node.js & npm
* Python 3.9+
* Expo Go app on your phone

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --reload

### 2. Frontend Setup

cd frontend
npm install
npx expo start --clear