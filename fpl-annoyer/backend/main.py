from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from fpl_service import get_team_info, check_for_issues, get_basic_info, analyze_team

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
    if data:
        return {"valid": True, "name": data['name']}
    return {"valid": False}

@app.get("/status/{team_id}")
def get_status(team_id: int):
    # This calculates the roast
    return analyze_team(team_id)