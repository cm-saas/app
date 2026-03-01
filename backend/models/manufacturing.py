from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"

class WorkCenter(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    name: str
    available_hours: float
    overtime_hours: float = 0.0
    efficiency_percent: float = 100.0
    current_load: float = 0.0
    utilization_percent: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    part_number: str
    quantity: int
    cycle_time_minutes: float
    priority: Priority
    work_center_id: str
    due_date: datetime
    status: OrderStatus = OrderStatus.PENDING
    required_hours: float = 0.0
    progress_percent: float = 0.0
    risk_level: str = "low"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Inventory(BaseModel):
    part_number: str
    stock_quantity: int
    daily_usage: float
    coverage_days: float = 0.0
    status: str = "safe"

class DashboardMetrics(BaseModel):
    stability_score: float
    bottleneck_work_center: Optional[str]
    bottleneck_utilization: float
    delivery_risk_percent: float
    total_buffer_hours: float
    on_time_delivery_percent: float
    efficiency_percent: float
    risk_events_count: int
    cost_impact_percent: float
