from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
import uuid
from datetime import datetime
import os

from models.production_log import ProductionLog, ProductionLogCreate, ProductionLogUpdate
from utils.auth import get_current_user

router = APIRouter(prefix="/api/data")

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
production_logs_collection = db.production_logs
orders_collection = db.orders

# Create unique compound index for user_id + order_id + date
async def create_production_indexes():
    """Create MongoDB indexes for production_logs collection"""
    try:
        # Create compound unique index on user_id, order_id, and date
        await production_logs_collection.create_index(
            [("user_id", 1), ("order_id", 1), ("date", 1)],
            unique=True,
            name="unique_user_order_date"
        )
        print("✓ Production logs collection indexes created successfully")
    except Exception as e:
        print(f"⚠ Production index creation warning: {e}")

# Call index creation on module load
import asyncio
try:
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.create_task(create_production_indexes())
    else:
        loop.run_until_complete(create_production_indexes())
except:
    pass

@router.get("/production", response_model=List[ProductionLog])
async def get_production_logs(current_user: dict = Depends(get_current_user)):
    """Get all production logs for the current user"""
    user_id = current_user["user_id"]
    
    logs = []
    async for log in production_logs_collection.find({"user_id": user_id}).sort("date", -1):
        log["_id"] = str(log["_id"])
        logs.append(log)
    
    return logs

@router.post("/production", response_model=ProductionLog)
async def create_production_log(log_data: ProductionLogCreate, current_user: dict = Depends(get_current_user)):
    """Create a new production log entry"""
    user_id = current_user["user_id"]
    
    # Find the order
    order = await orders_collection.find_one({"id": log_data.order_id, "user_id": user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order is unscheduled
    if order.get("unscheduled", False):
        raise HTTPException(status_code=400, detail="Cannot log production for unscheduled orders")
    
    # Calculate net_good from existing logs (produced - rejected)
    existing_logs = []
    async for log in production_logs_collection.find({"user_id": user_id, "order_id": log_data.order_id}):
        existing_logs.append(log)
    
    total_produced = sum(log.get("quantity_produced", 0) for log in existing_logs)
    total_rejected = sum(log.get("quantity_rejected", 0) for log in existing_logs)
    net_good = total_produced - total_rejected
    
    net_required_quantity = order.get("net_required_quantity", order.get("quantity", 0))
    remaining_quantity = net_required_quantity - net_good
    
    # Check if order is already completed
    if remaining_quantity <= 0:
        raise HTTPException(status_code=400, detail="Order is already completed")
    
    # Check if logging would exceed remaining quantity (based on net_good)
    # New net_good = current net_good + (new_produced - new_rejected)
    new_net_good = net_good + (log_data.quantity_produced - log_data.quantity_rejected)
    if new_net_good > net_required_quantity:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot exceed remaining quantity. Remaining: {remaining_quantity}"
        )
    
    # Check if log already exists for this date
    existing_log = await production_logs_collection.find_one({
        "user_id": user_id,
        "order_id": log_data.order_id,
        "date": log_data.date
    })
    
    if existing_log:
        raise HTTPException(status_code=400, detail="Production log already exists for this date")
    
    # Create new production log
    new_log = {
        "id": f"prod_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "order_id": log_data.order_id,
        "part_number": log_data.part_number,
        "date": log_data.date,
        "quantity_produced": log_data.quantity_produced,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await production_logs_collection.insert_one(new_log)
    new_log["_id"] = str(new_log["_id"])
    
    return new_log

@router.put("/production/{log_id}", response_model=ProductionLog)
async def update_production_log(log_id: str, log_data: ProductionLogUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing production log"""
    user_id = current_user["user_id"]
    
    # Find the log
    log = await production_logs_collection.find_one({"id": log_id, "user_id": user_id})
    if not log:
        raise HTTPException(status_code=404, detail="Production log not found")
    
    # If updating quantity, validate against remaining quantity
    if log_data.quantity_produced is not None:
        # Get order
        order = await orders_collection.find_one({"id": log["order_id"], "user_id": user_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Calculate actual_units_completed (excluding this log)
        existing_logs = []
        async for existing_log in production_logs_collection.find({
            "user_id": user_id, 
            "order_id": log["order_id"],
            "id": {"$ne": log_id}
        }):
            existing_logs.append(existing_log)
        
        actual_units_completed = sum(l.get("quantity_produced", 0) for l in existing_logs)
        net_required_quantity = order.get("net_required_quantity", order.get("quantity", 0))
        remaining_quantity = net_required_quantity - actual_units_completed
        
        # Check if new quantity would exceed remaining
        if log_data.quantity_produced > remaining_quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot exceed remaining quantity. Remaining: {remaining_quantity}"
            )
    
    # Check if updating date would create duplicate
    if log_data.date and log_data.date != log["date"]:
        existing_log = await production_logs_collection.find_one({
            "user_id": user_id,
            "order_id": log["order_id"],
            "date": log_data.date,
            "id": {"$ne": log_id}
        })
        if existing_log:
            raise HTTPException(status_code=400, detail="Production log already exists for this date")
    
    # Build update dict
    update_dict = {"updated_at": datetime.utcnow().isoformat()}
    
    if log_data.date:
        update_dict["date"] = log_data.date
    if log_data.quantity_produced is not None:
        update_dict["quantity_produced"] = log_data.quantity_produced
    
    # Update the log
    await production_logs_collection.update_one(
        {"id": log_id, "user_id": user_id},
        {"$set": update_dict}
    )
    
    # Fetch and return updated log
    updated_log = await production_logs_collection.find_one({"id": log_id, "user_id": user_id})
    updated_log["_id"] = str(updated_log["_id"])
    
    return updated_log

@router.delete("/production/{log_id}")
async def delete_production_log(log_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a production log"""
    user_id = current_user["user_id"]
    
    result = await production_logs_collection.delete_one({"id": log_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Production log not found")
    
    return {"message": "Production log deleted successfully"}
