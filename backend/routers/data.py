"""
Protected user data routes for work centers and orders
All data is isolated per user
"""
from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any
from utils.auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/data", tags=["User Data"])

# Dependency to get database
async def get_db():
    from server import db
    return db

# ==================== WORK CENTERS ====================

@router.post("/work-centers", status_code=status.HTTP_201_CREATED)
async def create_work_center(
    work_center_data: Dict[Any, Any],
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new work center for the current user"""
    
    # Add user_id and generate ID if not present
    work_center_data["user_id"] = current_user["user_id"]
    if "id" not in work_center_data or not work_center_data["id"]:
        work_center_data["id"] = str(uuid.uuid4())
    
    work_center_data["created_at"] = datetime.utcnow().isoformat()
    
    # Insert into database
    await db.work_centers.insert_one(work_center_data)
    
    # Remove MongoDB _id for response
    work_center_data.pop("_id", None)
    
    return work_center_data

@router.get("/work-centers")
async def get_work_centers(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all work centers for the current user"""
    
    work_centers = await db.work_centers.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return work_centers

@router.put("/work-centers/{wc_id}")
async def update_work_center(
    wc_id: str,
    work_center_data: Dict[Any, Any],
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a work center"""
    
    # Check if work center exists and belongs to user
    existing = await db.work_centers.find_one({
        "id": wc_id,
        "user_id": current_user["user_id"]
    })
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work center not found"
        )
    
    # Update work center
    work_center_data["user_id"] = current_user["user_id"]
    work_center_data["id"] = wc_id
    work_center_data["updated_at"] = datetime.utcnow().isoformat()
    
    await db.work_centers.update_one(
        {"id": wc_id, "user_id": current_user["user_id"]},
        {"$set": work_center_data}
    )
    
    # Get updated document
    updated = await db.work_centers.find_one(
        {"id": wc_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    return updated

@router.delete("/work-centers/{wc_id}")
async def delete_work_center(
    wc_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a work center"""
    
    result = await db.work_centers.delete_one({
        "id": wc_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work center not found"
        )
    
    return {"message": "Work center deleted successfully"}

# ==================== ORDERS ====================

@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: Dict[Any, Any],
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new order for the current user"""
    
    # Add user_id and generate ID if not present
    order_data["user_id"] = current_user["user_id"]
    if "id" not in order_data or not order_data["id"]:
        order_data["id"] = f"order_{uuid.uuid4().hex[:12]}"
    
    if "creation_timestamp" not in order_data:
        order_data["creation_timestamp"] = datetime.utcnow().isoformat()
    
    # Insert into database
    await db.orders.insert_one(order_data)
    
    # Remove MongoDB _id for response
    order_data.pop("_id", None)
    
    return order_data

@router.get("/orders")
async def get_orders(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all orders for the current user"""
    
    orders = await db.orders.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return orders

@router.put("/orders/{order_id}")
async def update_order(
    order_id: str,
    order_data: Dict[Any, Any],
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update an order"""
    
    # Check if order exists and belongs to user
    existing = await db.orders.find_one({
        "id": order_id,
        "user_id": current_user["user_id"]
    })
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update order
    order_data["user_id"] = current_user["user_id"]
    order_data["id"] = order_id
    order_data["updated_at"] = datetime.utcnow().isoformat()
    
    await db.orders.update_one(
        {"id": order_id, "user_id": current_user["user_id"]},
        {"$set": order_data}
    )
    
    # Get updated document
    updated = await db.orders.find_one(
        {"id": order_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    return updated

@router.delete("/orders/{order_id}")
async def delete_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete an order"""
    
    result = await db.orders.delete_one({
        "id": order_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return {"message": "Order deleted successfully"}

# ==================== BULK OPERATIONS ====================

@router.post("/bulk-update")
async def bulk_update(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Bulk update work centers and orders (used after scheduling)"""
    
    user_id = current_user["user_id"]
    
    # Update work centers
    if "workCenters" in data:
        for wc in data["workCenters"]:
            wc["user_id"] = user_id
            await db.work_centers.update_one(
                {"id": wc["id"], "user_id": user_id},
                {"$set": wc},
                upsert=True
            )
    
    # Update orders
    if "orders" in data:
        for order in data["orders"]:
            order["user_id"] = user_id
            await db.orders.update_one(
                {"id": order["id"], "user_id": user_id},
                {"$set": order},
                upsert=True
            )
    
    return {"message": "Bulk update successful"}
