from fastapi import APIRouter, HTTPException
from typing import List
from models.manufacturing import Order, OrderStatus
from services.scheduler import SchedulerService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/orders", tags=["orders"])

# In-memory storage (will be replaced with MongoDB queries)
orders_db = []

@router.post("", response_model=Order)
async def create_order(order: Order):
    """Create a new order and trigger schedule rebuild"""
    
    # Calculate required hours
    order.required_hours = SchedulerService.calculate_required_hours(order)
    
    # Generate new ID
    order.id = str(datetime.utcnow().timestamp())
    
    # Add to database
    orders_db.append(order)
    
    logger.info(f"Created order {order.id} for part {order.part_number}")
    
    return order

@router.get("", response_model=List[Order])
async def get_orders():
    """Get all orders"""
    return orders_db

@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get specific order"""
    order = next((o for o in orders_db if o.id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}", response_model=Order)
async def update_order(order_id: str, updated_order: Order):
    """Update an existing order"""
    
    order = next((o for o in orders_db if o.id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update fields
    order.part_number = updated_order.part_number
    order.quantity = updated_order.quantity
    order.cycle_time_minutes = updated_order.cycle_time_minutes
    order.priority = updated_order.priority
    order.work_center_id = updated_order.work_center_id
    order.due_date = updated_order.due_date
    order.status = updated_order.status
    order.progress_percent = updated_order.progress_percent
    
    # Recalculate required hours
    order.required_hours = SchedulerService.calculate_required_hours(order)
    
    logger.info(f"Updated order {order_id}")
    
    return order

@router.delete("/{order_id}")
async def delete_order(order_id: str):
    """Delete an order"""
    global orders_db
    
    order = next((o for o in orders_db if o.id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    orders_db = [o for o in orders_db if o.id != order_id]
    
    logger.info(f"Deleted order {order_id}")
    
    return {"message": "Order deleted successfully"}
