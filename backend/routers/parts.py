from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
import uuid
from datetime import datetime
import os

from ..models.part import Part, PartCreate, PartUpdate, RoutingStep
from ..utils.auth import get_current_user

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
parts_collection = db.parts

@router.get("/parts", response_model=List[Part])
async def get_parts(current_user: dict = Depends(get_current_user)):
    """Get all parts for the current user"""
    user_id = current_user["user_id"]
    
    parts = []
    async for part in parts_collection.find({"user_id": user_id}):
        part["_id"] = str(part["_id"])
        parts.append(part)
    
    return parts

@router.post("/parts", response_model=Part)
async def create_part(part_data: PartCreate, current_user: dict = Depends(get_current_user)):
    """Create a new part"""
    user_id = current_user["user_id"]
    
    # Check if part_number already exists for this user
    existing_part = await parts_collection.find_one({
        "user_id": user_id,
        "part_number": part_data.part_number
    })
    
    if existing_part:
        raise HTTPException(status_code=400, detail="Part number already exists")
    
    # Validate routing has at least 1 step
    if not part_data.default_routing or len(part_data.default_routing) == 0:
        raise HTTPException(status_code=400, detail="Part must have at least one routing step")
    
    # Create new part
    new_part = {
        "id": f"part_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "part_number": part_data.part_number,
        "description": part_data.description,
        "default_routing": [step.dict() for step in part_data.default_routing],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await parts_collection.insert_one(new_part)
    new_part["_id"] = str(new_part["_id"])
    
    return new_part

@router.put("/parts/{part_id}", response_model=Part)
async def update_part(part_id: str, part_data: PartUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing part"""
    user_id = current_user["user_id"]
    
    # Find the part
    part = await parts_collection.find_one({"id": part_id, "user_id": user_id})
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    # Check if updating part_number and if it conflicts with another part
    if part_data.part_number and part_data.part_number != part["part_number"]:
        existing_part = await parts_collection.find_one({
            "user_id": user_id,
            "part_number": part_data.part_number,
            "id": {"$ne": part_id}
        })
        if existing_part:
            raise HTTPException(status_code=400, detail="Part number already exists")
    
    # Validate routing if provided
    if part_data.default_routing is not None:
        if len(part_data.default_routing) == 0:
            raise HTTPException(status_code=400, detail="Part must have at least one routing step")
    
    # Build update dict
    update_dict = {"updated_at": datetime.utcnow().isoformat()}
    
    if part_data.part_number:
        update_dict["part_number"] = part_data.part_number
    if part_data.description is not None:
        update_dict["description"] = part_data.description
    if part_data.default_routing is not None:
        update_dict["default_routing"] = [step.dict() for step in part_data.default_routing]
    
    # Update the part
    await parts_collection.update_one(
        {"id": part_id, "user_id": user_id},
        {"$set": update_dict}
    )
    
    # Fetch and return updated part
    updated_part = await parts_collection.find_one({"id": part_id, "user_id": user_id})
    updated_part["_id"] = str(updated_part["_id"])
    
    return updated_part

@router.delete("/parts/{part_id}")
async def delete_part(part_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a part"""
    user_id = current_user["user_id"]
    
    result = await parts_collection.delete_one({"id": part_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Part not found")
    
    return {"message": "Part deleted successfully"}
