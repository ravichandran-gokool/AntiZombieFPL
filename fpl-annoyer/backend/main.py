from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from fpl_service import get_team_info, check_for_issues, get_basic_info, analyze_team, get_performance_shame

app = FastAPI(title="Simple FastAPI Server", version="1.0.0")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to FastAPI Server!", "status": "running"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/verify/{team_id}")
def verify_team(team_id: int):
    data = get_basic_info(team_id)
    if data.get('valid'):
        return {"valid": True, "name": data['name']}
    return {"valid": False}

@app.get("/status/{team_id}")
def get_status(team_id: int):
    # This calculates the roast
    return analyze_team(team_id)

@app.get("/team-info/{team_id}")
def team_info(team_id: int):
    # Get full team info from FPL API
    data = get_team_info(team_id)
    if not data:
        return {"error": "Team not found"}
    
    # Extract relevant fields for the dashboard
    return {
        "name": f"{data.get('player_first_name', '')} {data.get('player_last_name', '')}",
        "team_name": data.get('name', 'Unknown Team'),
        "entry_rank": data.get('entry_rank', 'N/A'),
        "overall_rank": data.get('overall_rank', 'N/A'),
        "points": data.get('summary_overall_points', 0),
        "total_transfers": data.get('total_transfers', 0),
        "region_rank": data.get('region_rank', 'N/A')
    }

@app.get("/shame/{team_id}")
def get_shame_notification(team_id: int):
    """Get performance shame notification for a team"""
    shame_data = get_performance_shame(team_id)
    if not shame_data:
        return {"error": "No shame data available"}
    return shame_data