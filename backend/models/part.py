from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class RoutingStep(BaseModel):
    sequence_number: int
    work_center_id: str
    cycle_time_minutes: float
    setup_time_hours: float

class Part(BaseModel):
    id: str
    user_id: str
    part_number: str
    description: str
    default_routing: List[RoutingStep]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PartCreate(BaseModel):
    part_number: str
    description: str
    default_routing: List[RoutingStep]

class PartUpdate(BaseModel):
    part_number: Optional[str] = None
    description: Optional[str] = None
    default_routing: Optional[List[RoutingStep]] = None
