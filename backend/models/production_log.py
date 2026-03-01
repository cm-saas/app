from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, date

class ProductionLog(BaseModel):
    id: str
    user_id: str
    order_id: str
    part_number: str
    date: str  # YYYY-MM-DD format
    quantity_produced: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductionLogCreate(BaseModel):
    order_id: str
    part_number: str
    date: str  # YYYY-MM-DD format
    quantity_produced: float
    
    @validator('quantity_produced')
    def validate_quantity(cls, v):
        if v < 0:
            raise ValueError('Quantity produced cannot be negative')
        return v
    
    @validator('date')
    def validate_date(cls, v):
        try:
            log_date = datetime.strptime(v, '%Y-%m-%d').date()
            today = date.today()
            if log_date > today:
                raise ValueError('Cannot log production for future dates')
        except ValueError as e:
            if 'future' in str(e):
                raise e
            raise ValueError('Invalid date format. Use YYYY-MM-DD')
        return v

class ProductionLogUpdate(BaseModel):
    date: Optional[str] = None
    quantity_produced: Optional[float] = None
    
    @validator('quantity_produced')
    def validate_quantity(cls, v):
        if v is not None and v < 0:
            raise ValueError('Quantity produced cannot be negative')
        return v
    
    @validator('date')
    def validate_date(cls, v):
        if v is None:
            return v
        try:
            log_date = datetime.strptime(v, '%Y-%m-%d').date()
            today = date.today()
            if log_date > today:
                raise ValueError('Cannot log production for future dates')
        except ValueError as e:
            if 'future' in str(e):
                raise e
            raise ValueError('Invalid date format. Use YYYY-MM-DD')
        return v
