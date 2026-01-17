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

def get_triple_captain_advice(team_id):
    # 1. SETUP: Get Static Data
    static_url = "https://fantasy.premierleague.com/api/bootstrap-static/"
    static_data = requests.get(static_url).json()
    
    # Get Next Gameweek ID
    next_event = next((e for e in static_data['events'] if e['is_next']), None)
    if not next_event:
        return {"recommend": False, "reason": "Season is over."}
    
    current_gw_id = next_event['id']
    
    # 2. THE NEW RULE LOGIC (Two Chips)
    history_url = f"https://fantasy.premierleague.com/api/entry/{team_id}/history/"
    history_data = requests.get(history_url).json()
    
    # Find all times TC was used: [{'name': '3xc', 'event': 1}, ...]
    tc_usage = [chip for chip in history_data['chips'] if chip['name'] == '3xc']
    
    chip_available = False
    
    # RULE: Chip 1 expires at GW19. Chip 2 starts at GW20.
    if current_gw_id < 20:
        # First Half of Season: Have we used it yet?
        if len(tc_usage) == 0:
            chip_available = True
        else:
            return {"recommend": False, "reason": "You used your First Half TC already. Wait until GW20."}
            
    else: # current_gw_id >= 20 (Second Half)
        # Second Half: Have we used a chip SINCE GW 20?
        # Note: We don't care if they used one in GW1-19, that one is gone anyway.
        usage_since_gw20 = [c for c in tc_usage if c['event'] >= 20]
        
        if len(usage_since_gw20) == 0:
            chip_available = True
        else:
            return {"recommend": False, "reason": "You already used your Second Half TC."}

    # If logic says no chip, stop here
    if not chip_available:
         return {"recommend": False, "reason": "No Triple Captain chip available right now."}

    # ----------------------------------------------------
    # 3. ANALYSIS: Only runs if chip IS available
    # ----------------------------------------------------
    
    # Find Double Gameweek Teams
    fixtures_url = "https://fantasy.premierleague.com/api/fixtures/"
    fixtures = requests.get(fixtures_url).json()
    
    team_counts = {}
    for f in fixtures:
        if f['event'] == current_gw_id:
            team_counts[f['team_h']] = team_counts.get(f['team_h'], 0) + 1
            team_counts[f['team_a']] = team_counts.get(f['team_a'], 0) + 1
            
    dgw_teams = [tid for tid, count in team_counts.items() if count > 1]
    
    if not dgw_teams:
        return {"recommend": False, "reason": "Save it! No Double Gameweek detected."}

    # Check User's Players
    current_picks_url = f"https://fantasy.premierleague.com/api/entry/{team_id}/event/{current_gw_id-1}/picks/"
    picks_data = requests.get(current_picks_url).json()
    
    candidates = []
    
    for pick in picks_data['picks']:
        player = next(p for p in static_data['elements'] if p['id'] == pick['element'])
        
        if player['team'] in dgw_teams:
            form = float(player['form'])
            ep = float(player['ep_next']) if player['ep_next'] else 0.0
            chance = player['chance_of_playing_next_round']
            
            # Strict Quality Filter
            if (chance is None or chance == 100) and (form > 5.0 or ep > 6.0):
                candidates.append({
                    "name": player['web_name'],
                    "score": form + ep
                })

    if not candidates:
        return {"recommend": False, "reason": "You have DGW players, but they are out of form."}
    
    best_player = sorted(candidates, key=lambda x: x['score'], reverse=True)[0]
    
    return {
        "recommend": True,
        "player": best_player['name'],
        "reason": f"ACTIVATE NOW! {best_player['name']} plays twice and is on fire!"
    }