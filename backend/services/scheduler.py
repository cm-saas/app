from typing import List, Dict, Optional
from datetime import datetime, timedelta
from models.manufacturing import WorkCenter, Order, DashboardMetrics, OrderStatus

class SchedulerService:
    """
    Core scheduling engine for FluxNex.
    Calculates capacity, bottlenecks, risks, and stability scores.
    """
    
    @staticmethod
    def calculate_required_hours(order: Order) -> float:
        """Calculate total hours required for an order"""
        return (order.quantity * order.cycle_time_minutes) / 60.0
    
    @staticmethod
    def calculate_work_center_utilization(
        work_center: WorkCenter, 
        orders: List[Order]
    ) -> Dict:
        """Calculate utilization for a work center"""
        
        # Filter orders for this work center
        wc_orders = [o for o in orders if o.work_center_id == work_center.id]
        
        # Calculate total load
        total_load = sum([
            SchedulerService.calculate_required_hours(o) 
            for o in wc_orders 
            if o.status != OrderStatus.COMPLETED
        ])
        
        # Apply efficiency factor
        effective_capacity = (work_center.available_hours + work_center.overtime_hours) * (work_center.efficiency_percent / 100.0)
        
        # Calculate utilization
        utilization = (total_load / effective_capacity * 100.0) if effective_capacity > 0 else 0.0
        
        return {
            "total_load": round(total_load, 2),
            "effective_capacity": round(effective_capacity, 2),
            "utilization_percent": round(utilization, 2),
            "buffer_hours": round(effective_capacity - total_load, 2)
        }
    
    @staticmethod
    def identify_bottleneck(
        work_centers: List[WorkCenter], 
        orders: List[Order]
    ) -> Optional[Dict]:
        """Find the most overloaded work center"""
        
        bottleneck = None
        max_utilization = 0.0
        
        for wc in work_centers:
            metrics = SchedulerService.calculate_work_center_utilization(wc, orders)
            if metrics["utilization_percent"] > max_utilization:
                max_utilization = metrics["utilization_percent"]
                bottleneck = {
                    "work_center_id": wc.id,
                    "work_center_name": wc.name,
                    "utilization_percent": metrics["utilization_percent"],
                    "status": "critical" if max_utilization > 95 else ("tight" if max_utilization > 85 else "normal")
                }
        
        return bottleneck
    
    @staticmethod
    def calculate_delivery_risk(orders: List[Order]) -> Dict:
        """Calculate delivery risk percentage"""
        
        if not orders:
            return {"risk_percent": 0.0, "at_risk_orders": 0, "total_orders": 0}
        
        active_orders = [o for o in orders if o.status != OrderStatus.COMPLETED]
        
        # Count orders at risk (within 3 days of due date or overdue)
        at_risk = 0
        today = datetime.utcnow()
        
        for order in active_orders:
            days_until_due = (order.due_date - today).days
            if days_until_due <= 3:  # Orders due within 3 days are at risk
                at_risk += 1
        
        risk_percent = (at_risk / len(active_orders) * 100.0) if active_orders else 0.0
        
        return {
            "risk_percent": round(risk_percent, 2),
            "at_risk_orders": at_risk,
            "total_orders": len(active_orders)
        }
    
    @staticmethod
    def calculate_stability_score(
        delivery_risk_percent: float,
        avg_utilization: float
    ) -> float:
        """
        Calculate stability score (0-100)
        Formula: 100 - (Risk% × 0.6 + Utilization% × 0.4)
        """
        score = 100 - (delivery_risk_percent * 0.6 + avg_utilization * 0.4)
        return max(0.0, min(100.0, round(score, 2)))
    
    @staticmethod
    def assign_risk_levels(orders: List[Order]) -> List[Order]:
        """Assign risk level to each order based on due date and capacity"""
        
        today = datetime.utcnow()
        
        for order in orders:
            if order.status == OrderStatus.COMPLETED:
                order.risk_level = "none"
                continue
            
            days_until_due = (order.due_date - today).days
            
            if days_until_due < 0:
                order.risk_level = "critical"
            elif days_until_due <= 2:
                order.risk_level = "high"
            elif days_until_due <= 5:
                order.risk_level = "medium"
            else:
                order.risk_level = "low"
        
        return orders
    
    @staticmethod
    def calculate_dashboard_metrics(
        work_centers: List[WorkCenter], 
        orders: List[Order]
    ) -> DashboardMetrics:
        """Calculate all dashboard metrics"""
        
        # Calculate utilization for all work centers
        total_utilization = 0.0
        total_buffer = 0.0
        
        for wc in work_centers:
            metrics = SchedulerService.calculate_work_center_utilization(wc, orders)
            total_utilization += metrics["utilization_percent"]
            total_buffer += metrics["buffer_hours"]
        
        avg_utilization = total_utilization / len(work_centers) if work_centers else 0.0
        
        # Identify bottleneck
        bottleneck = SchedulerService.identify_bottleneck(work_centers, orders)
        
        # Calculate delivery risk
        risk_data = SchedulerService.calculate_delivery_risk(orders)
        
        # Calculate stability score
        stability = SchedulerService.calculate_stability_score(
            risk_data["risk_percent"],
            avg_utilization
        )
        
        # Calculate on-time delivery %
        completed_orders = [o for o in orders if o.status == OrderStatus.COMPLETED]
        on_time = sum([1 for o in completed_orders if o.due_date >= datetime.utcnow()])
        on_time_percent = (on_time / len(completed_orders) * 100.0) if completed_orders else 100.0
        
        return DashboardMetrics(
            stability_score=stability,
            bottleneck_work_center=bottleneck["work_center_name"] if bottleneck else None,
            bottleneck_utilization=bottleneck["utilization_percent"] if bottleneck else 0.0,
            delivery_risk_percent=risk_data["risk_percent"],
            total_buffer_hours=round(total_buffer, 2),
            on_time_delivery_percent=round(on_time_percent, 2),
            efficiency_percent=round(avg_utilization, 2),
            risk_events_count=risk_data["at_risk_orders"],
            cost_impact_percent=round(risk_data["risk_percent"] * 0.8, 2)  # Estimated cost impact
        )
    
    @staticmethod
    def simulate_breakdown(
        work_center_id: str,
        breakdown_days: int,
        work_centers: List[WorkCenter],
        orders: List[Order]
    ) -> Dict:
        """Simulate impact of machine breakdown"""
        
        # Find the work center
        target_wc = next((wc for wc in work_centers if wc.id == work_center_id), None)
        if not target_wc:
            return {"error": "Work center not found"}
        
        # Calculate lost capacity
        hours_per_day = target_wc.available_hours / 5  # Assuming 5-day week
        lost_hours = hours_per_day * breakdown_days
        
        # Get current metrics
        current_metrics = SchedulerService.calculate_dashboard_metrics(work_centers, orders)
        
        # Simulate by reducing available hours
        target_wc.available_hours -= lost_hours
        simulated_metrics = SchedulerService.calculate_dashboard_metrics(work_centers, orders)
        
        # Restore original capacity
        target_wc.available_hours += lost_hours
        
        return {
            "breakdown_days": breakdown_days,
            "lost_hours": round(lost_hours, 2),
            "current_risk_percent": current_metrics.delivery_risk_percent,
            "simulated_risk_percent": simulated_metrics.delivery_risk_percent,
            "risk_increase": round(simulated_metrics.delivery_risk_percent - current_metrics.delivery_risk_percent, 2),
            "current_stability": current_metrics.stability_score,
            "simulated_stability": simulated_metrics.stability_score
        }
