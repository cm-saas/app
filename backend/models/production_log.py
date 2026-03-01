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
    quantity_rejected: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductionLogCreate(BaseModel):
    order_id: str
    part_number: str
    date: str  # YYYY-MM-DD format
    quantity_produced: float
    quantity_rejected: float = 0.0
    
    @validator('quantity_produced')
    def validate_quantity_produced(cls, v):
        if v < 0:
            raise ValueError('Quantity produced cannot be negative')
        return v
    
    @validator('quantity_rejected')
    def validate_quantity_rejected(cls, v, values):
        if v < 0:
            raise ValueError('Quantity rejected cannot be negative')
        
        quantity_produced = values.get('quantity_produced', 0)
        
        if v > quantity_produced:
            raise ValueError('Quantity rejected cannot exceed quantity produced')
        
        if v > 0 and quantity_produced == 0:
            raise ValueError('Cannot have rejections without production')
        
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
    quantity_rejected: Optional[float] = None
    
    @validator('quantity_produced')
    def validate_quantity_produced(cls, v):
        if v is not None and v < 0:
            raise ValueError('Quantity produced cannot be negative')
        return v
    
    @validator('quantity_rejected')
    def validate_quantity_rejected(cls, v, values):
        if v is not None:
            if v < 0:
                raise ValueError('Quantity rejected cannot be negative')
            
            # Note: quantity_produced validation happens in the router
            # where we have access to existing log data
        
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
