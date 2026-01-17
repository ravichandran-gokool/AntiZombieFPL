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

def get_performance_shame(team_id):
    """
    Compare a team's gameweek performance against the average.
    Returns shame notification if they underperformed.
    """
    try:
        # 1. Get static data for current GW info
        static_url = "https://fantasy.premierleague.com/api/bootstrap-static/"
        static_data = requests.get(static_url).json()
        
        # 2. Find the most recent finished gameweek (not current)
        finished_gws = [event for event in static_data['events'] if event['finished'] and not event['is_current']]
        if not finished_gws:
            return None
        
        last_gw = finished_gws[-1]['id']
        average_score = finished_gws[-1]['average_entry_score']
        
        # 3. Get team's entry history to find their points for the GW
        entry_history_url = f"https://fantasy.premierleague.com/api/entry/{team_id}/history/"
        entry_history_resp = requests.get(entry_history_url)
        
        if entry_history_resp.status_code != 200:
            return None
        
        entry_history = entry_history_resp.json()
        
        # Find the GW in history
        gw_data = next((g for g in entry_history['current'] if g['event'] == last_gw), None)
        
        if not gw_data:
            return None
        
        team_points = gw_data['points']
        
        # 4. Compare and shame if underperforming
        if team_points < average_score:
            deficit = average_score - team_points
            return {
                "type": "performance_shame",
                "gw": last_gw,
                "team_points": team_points,
                "average_score": average_score,
                "deficit": deficit,
                "message": f"🔥 YIKES! You scored {team_points} points in GW{last_gw}, but the average was {average_score}. You're {deficit} points below average! Get it together!",
                "shamed": True
            }
        else:
            return {
                "type": "performance_praise",
                "gw": last_gw,
                "team_points": team_points,
                "average_score": average_score,
                "surplus": team_points - average_score,
                "message": f"🎯 Not bad! You scored {team_points} points in GW{last_gw}, which is {team_points - average_score} above average.",
                "shamed": False
            }
    
    except Exception as e:
        print(f"Error calculating shame: {e}")
        return None