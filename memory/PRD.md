# FluxNex - Predictive Manufacturing Intelligence Platform
## Product Requirements Document

---

## Project Evolution

**Phase 1 (Complete)**: Landing page for marketing and lead generation  
**Phase 2 (In Progress)**: Full-stack web application with scheduling engine

---

## Original Problem Statement

Build FluxNex as a constraint-based manufacturing intelligence platform that predicts delivery risk before delays happen.

**NOT**: Inventory software, ERP replacement, or accounting tool  
**IS**: Predictive intelligence layer that works alongside existing ERP systems

---

## Current Architecture (Phase 2)

### Backend Stack
- **Framework**: FastAPI (Python)
- **Database**: MongoDB  
- **Core Engine**: Custom scheduling & constraint analysis engine
- **API Design**: RESTful with separate routers for concerns

### Backend Modules

#### 1. Models (`/backend/models/manufacturing.py`)
- `WorkCenter`: Machine/station with capacity, efficiency, utilization
- `Order`: Production order with cycle time, priority, due date
- `Inventory`: Stock levels and coverage analysis
- `DashboardMetrics`: Aggregated KPIs

#### 2. Services (`/backend/services/scheduler.py`)
**SchedulerService** - Core calculation engine:
- `calculate_required_hours()`: Order → hours conversion
- `calculate_work_center_utilization()`: Load vs capacity analysis
- `identify_bottleneck()`: Find most constrained resource
- `calculate_delivery_risk()`: Risk % based on due dates & capacity
- `calculate_stability_score()`: Overall system health (0-100)
- `assign_risk_levels()`: Classify orders as low/medium/high/critical risk
- `simulate_breakdown()`: What-if analysis for downtime scenarios

#### 3. API Routers

**Orders Router** (`/api/orders`):
- `POST /api/orders` - Create new order (auto-calculates required hours)
- `GET /api/orders` - List all orders
- `GET /api/orders/{id}` - Get specific order
- `PUT /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order

**Work Centers Router** (`/api/work-centers`):
- `POST /api/work-centers` - Create work center
- `GET /api/work-centers` - List all work centers
- `GET /api/work-centers/{id}` - Get specific work center
- `PUT /api/work-centers/{id}` - Update work center
- `DELETE /api/work-centers/{id}` - Delete work center
- `POST /api/work-centers/seed` - Initialize with sample data

**Dashboard Router** (`/api/dashboard`):
- `GET /api/dashboard/metrics` - Complete dashboard KPIs
  - Stability score
  - Bottleneck identification
  - Delivery risk %
  - Buffer hours
  - On-time delivery %
  - Efficiency %
- `GET /api/dashboard/production-plan` - Today's schedule with risk levels
- `GET /api/dashboard/capacity-utilization` - Per work center breakdown
- `POST /api/dashboard/simulate-breakdown` - Breakdown impact simulation
- `POST /api/dashboard/rebuild` - Force recalculation

---

## Scheduling Engine Logic

### 1. Capacity Calculation
```
Required Hours = (Quantity × Cycle Time) / 60
Effective Capacity = (Available Hours + Overtime) × (Efficiency % / 100)
Utilization % = (Total Load / Effective Capacity) × 100
```

### 2. Bottleneck Detection
```
For each work center:
  - Calculate utilization %
  - Status = CRITICAL if > 95%
           = TIGHT if > 85%
           = NORMAL otherwise
Bottleneck = Work center with highest utilization
```

### 3. Delivery Risk Calculation
```
For each active order:
  - Days Until Due = Due Date - Today
  - Risk = CRITICAL if overdue
         = HIGH if ≤ 2 days
         = MEDIUM if ≤ 5 days
         = LOW otherwise

Overall Risk % = (At-Risk Orders / Total Active Orders) × 100
```

### 4. Stability Score
```
Stability = 100 - (Delivery Risk % × 0.6 + Avg Utilization % × 0.4)
Range: 0-100 (higher = more stable)
```

### 5. Breakdown Simulation
```
Simulated Lost Hours = (Work Center Hours/Day) × Breakdown Days
Simulated Utilization = Current Load / (Capacity - Lost Hours)
Risk Increase = Simulated Risk % - Current Risk %
```

---

## What's Been Implemented

### Date: December 22, 2025 - Backend Complete

#### ✅ Backend Implementation

**Core Scheduling Engine**:
- ✅ Work center utilization calculator
- ✅ Bottleneck identification algorithm
- ✅ Delivery risk assessment (time-based)
- ✅ Stability score calculation
- ✅ Breakdown impact simulation
- ✅ Order risk level classification

**API Endpoints** (13 total):
- ✅ Full CRUD for Orders
- ✅ Full CRUD for Work Centers
- ✅ Dashboard metrics aggregation
- ✅ Production plan generation
- ✅ Capacity utilization breakdown
- ✅ Breakdown simulation
- ✅ Schedule rebuild trigger
- ✅ Sample data seeding

**Data Persistence**:
- ✅ In-memory storage (for MVP)
- 🔄 MongoDB integration (ready, not activated yet)

**Testing**:
- ✅ Work center seeding verified
- ✅ API endpoints responding correctly

---

## Frontend Requirements (Phase 2 - Next)

### Dashboard Layout
1. **Sidebar Navigation**: Logo, Dashboard, Orders, Capacity, Timeline, Risks, Inventory, Reports, Settings
2. **Top Bar**: Plant selector, Shift selector, Simulate button, Add Order button, Live Mode toggle, User profile
3. **Main Content**: 3-column responsive grid

### Widgets to Build
1. **Stability Score Gauge**: Visual gauge (0-100)
2. **Bottleneck Card**: Most constrained work center with status badge
3. **Delivery Risk %**: Risk percentage with trend indicator
4. **Inventory Status**: Coverage days with color coding
5. **Buffer Hours**: Available slack capacity
6. **Production Plan Table**: Today's orders with risk badges
7. **Capacity Utilization Donut**: Visual breakdown by work center
8. **Key Metrics Grid**: 4 KPI cards (OTD%, Efficiency%, Risk Events, Cost Impact%)

### Interactions to Implement
- **Add Order Modal**: Form → POST /api/orders → Refresh dashboard
- **Simulate Breakdown**: Select work center + days → POST /api/dashboard/simulate-breakdown
- **Live Updates**: Poll GET /api/dashboard/metrics every 30s (or WebSocket later)

---

## API Testing Examples

```bash
# Seed work centers
curl -X POST http://localhost:8001/api/work-centers/seed

# Get dashboard metrics
curl -X GET http://localhost:8001/api/dashboard/metrics

# Create an order
curl -X POST http://localhost:8001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "part_number": "PART-001",
    "quantity": 100,
    "cycle_time_minutes": 5.5,
    "priority": "high",
    "work_center_id": "wc_1",
    "due_date": "2025-12-30T00:00:00"
  }'

# Simulate breakdown
curl -X POST http://localhost:8001/api/dashboard/simulate-breakdown \
  -H "Content-Type: application/json" \
  -d '{
    "work_center_id": "wc_1",
    "breakdown_days": 2
  }'
```

---

## Next Tasks

### Immediate (P0)
1. **Frontend Dashboard**: Build React dashboard consuming backend APIs
2. **Add Order Modal**: Functional form with validation
3. **Real-time Updates**: Implement polling or WebSocket
4. **Authentication**: Add user login (optional for MVP)

### Near-term (P1)
5. **MongoDB Persistence**: Activate DB instead of in-memory storage
6. **Error Handling**: Comprehensive validation & error responses
7. **Unit Tests**: Test coverage for scheduler logic
8. **API Documentation**: Auto-generated Swagger/OpenAPI docs

### Future (P2)
9. **Advanced Scheduling**: Consider priority, dependencies
10. **Historical Analytics**: Track trends over time
11. **Optimization Suggestions**: AI-powered recommendations
12. **Multi-plant Support**: Handle multiple facilities

---

## Technical Decisions

### Why In-Memory Storage for MVP?
- Faster development iteration
- No MongoDB schema migrations during rapid prototyping
- Easy to switch to MongoDB later (models already defined)

### Why Backend-Only Calculations?
- Single source of truth
- Consistent business logic
- Frontend just displays results
- Easier to test and debug

### Why Separate Routers?
- Clean separation of concerns
- Easier to maintain and extend
- Clear API boundaries
- Better testability

---

## Performance Targets

- Dashboard metrics calculation: < 500ms
- Order creation + recalculation: < 1s
- Breakdown simulation: < 300ms
- Support up to 150 work centers, 1000 active orders

---

*Last Updated: December 22, 2025 - Phase 2 Backend Complete*
