from fastapi import APIRouter, HTTPException
from models.manufacturing import DashboardMetrics, Order
from services.scheduler import SchedulerService
from routers.orders import orders_db
from routers.work_centers import work_centers_db
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    """Get all dashboard metrics calculated by scheduling engine"""
    
    if not work_centers_db:
        raise HTTPException(
            status_code=400, 
            detail="No work centers configured. Please seed work centers first."
        )
    
    # Assign risk levels to orders
    updated_orders = SchedulerService.assign_risk_levels(orders_db)
    
    # Calculate all metrics
    metrics = SchedulerService.calculate_dashboard_metrics(
        work_centers_db,
        updated_orders
    )
    
    logger.info("Calculated dashboard metrics")
    
    return metrics

@router.get("/production-plan", response_model=List[Dict])
async def get_production_plan():
    """Get today's production plan with calculated fields"""
    
    production_plan = []
    
    for order in orders_db:
        # Find work center name
        wc = next((w for w in work_centers_db if w.id == order.work_center_id), None)
        
        plan_item = {
            "order_id": order.id,
            "part_number": order.part_number,
            "work_center": wc.name if wc else "Unknown",
            "required_hours": round(order.required_hours, 2),
            "progress_percent": order.progress_percent,
            "due_date": order.due_date.isoformat(),
            "status": order.status,
            "risk_level": order.risk_level,
            "priority": order.priority
        }
        
        production_plan.append(plan_item)
    
    return production_plan

@router.get("/capacity-utilization", response_model=List[Dict])
async def get_capacity_utilization():
    """Get capacity utilization breakdown by work center"""
    
    utilization_data = []
    
    for wc in work_centers_db:
        metrics = SchedulerService.calculate_work_center_utilization(wc, orders_db)
        
        utilization_data.append({
            "work_center_id": wc.id,
            "work_center_name": wc.name,
            "total_load": metrics["total_load"],
            "effective_capacity": metrics["effective_capacity"],
            "utilization_percent": metrics["utilization_percent"],
            "buffer_hours": metrics["buffer_hours"],
            "status": "critical" if metrics["utilization_percent"] > 95 else (
                "tight" if metrics["utilization_percent"] > 85 else "normal"
            )
        })
    
    return utilization_data

@router.post("/simulate-breakdown")
async def simulate_breakdown(
    work_center_id: str,
    breakdown_days: int
):
    """Simulate impact of machine breakdown"""
    
    result = SchedulerService.simulate_breakdown(
        work_center_id,
        breakdown_days,
        work_centers_db,
        orders_db
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    logger.info(f"Simulated {breakdown_days}-day breakdown for work center {work_center_id}")
    
    return result

@router.post("/rebuild")
async def rebuild_schedule():
    """Trigger complete schedule recalculation"""
    
    # Recalculate required hours for all orders
    for order in orders_db:
        order.required_hours = SchedulerService.calculate_required_hours(order)
    
    # Assign risk levels
    SchedulerService.assign_risk_levels(orders_db)
    
    # Calculate updated metrics
    metrics = SchedulerService.calculate_dashboard_metrics(
        work_centers_db,
        orders_db
    )
    
    logger.info("Rebuilt schedule")
    
    return {
        "message": "Schedule rebuilt successfully",
        "metrics": metrics
    }
