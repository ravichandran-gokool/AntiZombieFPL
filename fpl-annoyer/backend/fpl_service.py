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