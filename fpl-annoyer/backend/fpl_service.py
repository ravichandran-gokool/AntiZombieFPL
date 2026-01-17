import requests

def get_team_info(team_id):
    # 1. Get Basic Info
    url = f"https://fantasy.premierleague.com/api/entry/{team_id}/"
    response = requests.get(url)
    if response.status_code != 200:
        return None
    return response.json()

def check_for_issues(team_id):
    # 1. Get User's Team (Picks)
    # Note: You need the current Gameweek ID. For Hackathon, hardcode it or fetch it dynamically.
    # Let's assume GW 21 for now (check real life GW).
    gw_url = f"https://fantasy.premierleague.com/api/entry/{team_id}/event/21/picks/" 
    picks_res = requests.get(gw_url)

    # 2. Get Player Data (Who is injured?)
    static_url = "https://fantasy.premierleague.com/api/bootstrap-static/"
    static_res = requests.get(static_url).json()

    # Simple Logic: Returns "Annoyance Score" (0-100) and a "Reason"
    # ... (Write logic to compare picks vs injured players)

    return {
        "annoyance_level": 100, 
        "message": "You have 3 injured players. Delete the app.",
        "rank": 5000000
    }

def get_basic_info(team_id):
    # Hits the FPL API to get name
    url = f"https://fantasy.premierleague.com/api/entry/{team_id}/"
    resp = requests.get(url)
    if resp.status_code == 200:
        data = resp.json()
        print(data)
        return {"valid": True, "name": f"{data['player_first_name']} {data['player_last_name']}"}
    return {"valid": False}

def analyze_team(team_id):
    # 1. Get Live Gameweek Data (Static)
    static_url = "https://fantasy.premierleague.com/api/bootstrap-static/"
    static_data = requests.get(static_url).json()
    
    # 2. Find current Gameweek
    current_gw = next(event['id'] for event in static_data['events'] if event['is_current'])
    
    # 3. Get User's Picks for this GW
    picks_url = f"https://fantasy.premierleague.com/api/entry/{team_id}/event/{current_gw}/picks/"
    picks_resp = requests.get(picks_url)
    
    if picks_resp.status_code != 200:
        return {"annoyance": 0, "message": "Could not fetch team data."}

    picks_data = picks_resp.json()
    
    # 4. Check for Injuries in Starting XI (Players 1-11)
    injured_players = []
    starting_xi = picks_data['picks'][0:11] # First 11 players
    
    for pick in starting_xi:
        player_id = pick['element']
        # Find player stats in static_data
        player_stats = next(p for p in static_data['elements'] if p['id'] == player_id)
        
        # Status 'd', 'i', 's' means unavailable/doubtful
        if player_stats['status'] in ['d', 'i', 's']:
            injured_players.append(player_stats['web_name'])

    # 5. Calculate Score
    annoyance = 0
    message = "Your team is surprisingly adequate."
    
    if len(injured_players) > 0:
        annoyance = 100
        message = f"YOU IDIOT! {', '.join(injured_players)} are injured! FIX IT NOW!"

    return {
        "annoyance": annoyance,
        "message": message,
        "injured_count": len(injured_players)
    }

#Part B
BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"

def fetch_bootstrap_static():
    res = requests.get(BOOTSTRAP_URL, timeout=15)
    res.raise_for_status()
    return res.json()

def get_current_gameweek_id(static_data):
    # event where is_current = True
    current = next((e for e in static_data["events"] if e.get("is_current")), None)
    return current["id"] if current else None

def build_player_index(static_data):
    # map player_id -> player dict
    return {p["id"]: p for p in static_data["elements"]}


#injury watchdog lah
def injury_watchdog(team_id: int):
    """
    Checks if any unavailable players (d/i/s) are in the starting XI (picks 1-11).
    Returns a structured response the frontend can use.
    """
    # 1) Get bootstrap-static once
    try:
        static_data = fetch_bootstrap_static()
    except Exception:
        return {
            "ok": False,
            "message": "Failed to fetch FPL static data.",
            "flagged_players": [],
            "unavailable_count": 0
        }

    # 2) Find current GW
    current_gw = get_current_gameweek_id(static_data)
    if not current_gw:
        return {
            "ok": False,
            "message": "Could not determine the current gameweek.",
            "flagged_players": [],
            "unavailable_count": 0
        }

    # 3) Fetch user's picks for current GW
    picks_url = f"https://fantasy.premierleague.com/api/entry/{team_id}/event/{current_gw}/picks/"
    picks_res = requests.get(picks_url, timeout=15)

    if picks_res.status_code != 200:
        return {
            "ok": False,
            "message": "Could not fetch team picks. Is the team_id correct?",
            "flagged_players": [],
            "unavailable_count": 0
        }

    picks_data = picks_res.json()

    # 4) Build quick lookup for player info
    player_index = build_player_index(static_data)

    # 5) Check starting XI (first 11 picks)
    starting_xi = picks_data["picks"][:11]
    unavailable = []
    unavailable_statuses = {"d": "Doubtful", "i": "Injured", "s": "Suspended"}

    for pick in starting_xi:
        player_id = pick["element"]
        player = player_index.get(player_id)

        if not player:
            continue

        status = player.get("status")
        if status in unavailable_statuses:
            unavailable.append({
                "player_id": player_id,
                "name": player.get("web_name"),
                "status_code": status,
                "status_label": unavailable_statuses[status]
            })

    # 6) Return result (this is your “alert trigger” output)
    if unavailable:
        names = ", ".join(p["name"] for p in unavailable)
        return {
            "ok": True,
            "alert": True,
            "notification": f"⚠️ ALERT: {names} will likely not play this gameweek.",
            "message": "Unavailable player(s) detected in starting XI.",
            "flagged_players": unavailable,
            "unavailable_count": len(unavailable),
            "gameweek": current_gw
        }

    return {
        "ok": True,
        "alert": False,
        "message": "No unavailable players in starting XI.",
        "flagged_players": [],
        "unavailable_count": 0,
        "gameweek": current_gw
    }
