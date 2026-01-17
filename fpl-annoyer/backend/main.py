from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Simple FastAPI Server", version="1.0.0")


class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float


class ItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float


# In-memory storage for demo purposes
items_db = []
next_id = 1


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to FastAPI Server!", "status": "running"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/items", response_model=List[ItemResponse])
async def get_items():
    """Get all items"""
    return items_db


@app.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: int):
    """Get a specific item by ID"""
    for item in items_db:
        if item["id"] == item_id:
            return item
    return JSONResponse(
        status_code=404,
        content={"detail": f"Item with id {item_id} not found"}
    )


@app.post("/items", response_model=ItemResponse, status_code=201)
async def create_item(item: Item):
    """Create a new item"""
    global next_id
    new_item = {
        "id": next_id,
        "name": item.name,
        "description": item.description,
        "price": item.price
    }
    items_db.append(new_item)
    next_id += 1
    return new_item


@app.delete("/items/{item_id}", status_code=204)
async def delete_item(item_id: int):
    """Delete an item by ID"""
    for i, item in enumerate(items_db):
        if item["id"] == item_id:
            items_db.pop(i)
            return None
    return JSONResponse(
        status_code=404,
        content={"detail": f"Item with id {item_id} not found"}
    )
