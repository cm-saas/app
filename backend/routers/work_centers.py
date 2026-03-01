from fastapi import APIRouter, HTTPException
from typing import List
from models.manufacturing import WorkCenter
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/work-centers", tags=["work-centers"])

# In-memory storage (will be replaced with MongoDB queries)
work_centers_db = []

@router.post("", response_model=WorkCenter)
async def create_work_center(wc: WorkCenter):
    """Create a new work center"""
    
    wc.id = str(datetime.utcnow().timestamp())
    work_centers_db.append(wc)
    
    logger.info(f"Created work center {wc.id}: {wc.name}")
    
    return wc

@router.get("", response_model=List[WorkCenter])
async def get_work_centers():
    """Get all work centers"""
    return work_centers_db

@router.get("/{wc_id}", response_model=WorkCenter)
async def get_work_center(wc_id: str):
    """Get specific work center"""
    wc = next((w for w in work_centers_db if w.id == wc_id), None)
    if not wc:
        raise HTTPException(status_code=404, detail="Work center not found")
    return wc

@router.put("/{wc_id}", response_model=WorkCenter)
async def update_work_center(wc_id: str, updated_wc: WorkCenter):
    """Update a work center"""
    
    wc = next((w for w in work_centers_db if w.id == wc_id), None)
    if not wc:
        raise HTTPException(status_code=404, detail="Work center not found")
    
    wc.name = updated_wc.name
    wc.available_hours = updated_wc.available_hours
    wc.overtime_hours = updated_wc.overtime_hours
    wc.efficiency_percent = updated_wc.efficiency_percent
    
    logger.info(f"Updated work center {wc_id}")
    
    return wc

@router.delete("/{wc_id}")
async def delete_work_center(wc_id: str):
    """Delete a work center"""
    global work_centers_db
    
    wc = next((w for w in work_centers_db if w.id == wc_id), None)
    if not wc:
        raise HTTPException(status_code=404, detail="Work center not found")
    
    work_centers_db = [w for w in work_centers_db if w.id != wc_id]
    
    logger.info(f"Deleted work center {wc_id}")
    
    return {"message": "Work center deleted successfully"}

@router.post("/seed")
async def seed_work_centers():
    """Seed initial work centers for testing"""
    global work_centers_db
    
    if len(work_centers_db) > 0:
        return {"message": "Work centers already exist"}
    
    initial_wcs = [
        WorkCenter(
            id="wc_1",
            name="CNC Mill 01",
            available_hours=160.0,
            overtime_hours=20.0,
            efficiency_percent=95.0
        ),
        WorkCenter(
            id="wc_2",
            name="Lathe 02",
            available_hours=160.0,
            overtime_hours=15.0,
            efficiency_percent=92.0
        ),
        WorkCenter(
            id="wc_3",
            name="Assembly Line A",
            available_hours=160.0,
            overtime_hours=25.0,
            efficiency_percent=98.0
        ),
        WorkCenter(
            id="wc_4",
            name="Injection Mold 05",
            available_hours=168.0,
            overtime_hours=0.0,
            efficiency_percent=88.0
        )
    ]
    
    work_centers_db.extend(initial_wcs)
    
    logger.info("Seeded work centers")
    
    return {"message": f"Created {len(initial_wcs)} work centers"}
