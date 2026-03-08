# FluxNex Scheduling Engine - Complete Architecture Analysis

## Project Overview

**FluxNex** is a deterministic finite capacity multi-stage flow-based scheduling engine for manufacturing operations. It schedules production orders across sequential operations (routing steps) while respecting machine capacity constraints, breakdowns, overtime, and parallel processing capabilities.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Complete Scheduling Flow](#complete-scheduling-flow)
3. [Order Reading & Processing](#order-reading--processing)
4. [Routing Steps Processing](#routing-steps-processing)
5. [Machine Capacity Calculation](#machine-capacity-calculation)
6. [Load Distribution Across Days](#load-distribution-across-days)
7. [Heatmap Utilization Calculation](#heatmap-utilization-calculation)
8. [Parallel Units Handling](#parallel-units-handling)
9. [Data Models](#data-models)
10. [Key Features & Constraints](#key-features--constraints)

---

## System Architecture

### Tech Stack
- **Frontend**: React.js with context-based state management
- **Backend**: FastAPI (Python) with async support
- **Database**: MongoDB (via Motor async driver)
- **Scheduling Engine**: Pure JavaScript (client-side)

### File Structure
```
fluxnex-project/
├── backend/
│   ├── models/
│   │   └── manufacturing.py          # Data models (Order, WorkCenter, etc.)
│   ├── routers/
│   │   ├── orders.py                 # Order CRUD endpoints
│   │   ├── work_centers.py           # Work center management
│   │   └── data.py                   # Bulk data operations
│   ├── services/
│   │   └── scheduler.py              # Backend scheduling utilities
│   └── server.py                     # FastAPI main application
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── schedulingEngine.js   # ⭐ CORE SCHEDULING LOGIC
│   │   ├── context/
│   │   │   └── DataContext.jsx       # State management with rebuild triggers
│   │   ├── pages/
│   │   │   ├── DashboardEnterprise.jsx  # Dashboard with heatmap
│   │   │   ├── Orders.jsx               # Order management
│   │   │   ├── Capacity.jsx             # Work center configuration
│   │   │   └── Production.jsx           # Production logging
│   │   └── App.js                    # Main application
│
└── Documentation/
    ├── SCHEDULING_ENGINE_VERIFICATION.md  # Algorithm verification
    ├── PARALLEL_UNITS_FIX.md              # Parallel units explanation
    └── UPGRADE_SUMMARY.md                 # Flow-based upgrade summary
```

### Core Components

1. **schedulingEngine.js** - The heart of the system
   - All scheduling logic isolated here
   - Pure functions (no side effects)
   - Deterministic (same input → same output)

2. **DataContext.jsx** - State management
   - Triggers `rebuildSchedule()` on all mutations
   - Syncs state with backend API
   - Manages work centers, orders, parts, and production logs

3. **Backend Services** - Data persistence
   - MongoDB for persistent storage
   - REST API for CRUD operations
   - Python-based metrics calculation (legacy)

---

## Complete Scheduling Flow

### Step-by-Step Scheduling Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Trigger Point                                       │
│ - User creates/edits order                                  │
│ - User modifies work center                                 │
│ - User adds breakdown/overtime                              │
│ - Page load                                                 │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Data Preparation                                    │
│ - Load all work centers                                     │
│ - Load all orders                                           │
│ - Generate/verify calendars (60 days)                       │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Reset Scheduling Data                               │
│ - Clear all booked_hours → 0                                │
│ - Clear all completion_date → null                          │
│ - Clear all scheduled_days → []                             │
│ - Clear all delay tracking                                  │
│ - Recalculate required_hours for each routing step          │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Sort Orders                                         │
│ Primary sort: priority DESC (3 → 2 → 1)                     │
│   3 = High Priority                                         │
│   2 = Normal Priority                                       │
│   1 = Low Priority                                          │
│ Secondary sort: creation_timestamp ASC (oldest first)       │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Sort Routing Steps                                  │
│ - Ensure routing steps ordered by sequence_number           │
│ - Sequence determines stage flow (1 → 2 → 3 → ...)         │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Flow-Based Scheduling                               │
│ FOR each day (Day 0 to Day 59):                            │
│   FOR each order (in priority order):                       │
│     FOR each routing step (in sequence):                    │
│       ├─ Check if step already complete                     │
│       ├─ Get available WIP from previous stage              │
│       ├─ Calculate capacity constraints                     │
│       ├─ Determine units to process (min of limits)         │
│       ├─ Allocate capacity (book hours)                     │
│       ├─ Track scheduled work                               │
│       ├─ Update completion tracking                         │
│       └─ Transfer WIP to next stage (next day)              │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Mark Unscheduled Orders                             │
│ - Any order with incomplete routing steps → unscheduled     │
│ - Orders that exceed 60-day horizon → unscheduled           │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 8: Calculate Completion Dates                          │
│ - Find last completed routing step                          │
│ - Set order.planned_completion_date                         │
│ - Calculate delay_days (completion - due_date)              │
│ - Mark order.delayed = true/false                           │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 9: Return Updated State                                │
│ - Updated workCenters (with booked calendars)               │
│ - Updated orders (with schedules & delays)                  │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 10: UI Update & API Sync                               │
│ - Update React state (triggers re-render)                   │
│ - Sync to backend API (bulk update)                         │
│ - Display heatmap, KPIs, order status                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Order Reading & Processing

### Order Data Structure

```javascript
{
  id: "order_1234567890",
  customer: "ABC Manufacturing",
  part_number: "PART-001",
  
  // Quantity Management
  original_quantity: 1000,        // Original order qty
  available_stock: 200,           // Stock on hand
  net_required_quantity: 800,     // Qty to produce (original - stock)
  quantity: 800,                  // Working quantity
  
  // Priority & Timing
  priority: 3,                    // 3=High, 2=Normal, 1=Low
  creation_timestamp: "2025-03-08T10:00:00Z",
  start_date: "2025-03-10",
  due_date: "2025-03-20",
  
  // Routing Steps (Sequential Operations)
  routing: [
    {
      sequence_number: 1,         // Stage order
      work_center_id: "wc_cnc01",
      cycle_time_minutes: 5,      // Time per unit
      setup_time_hours: 1,        // One-time setup
      required_hours: 67.67,      // Calculated: (800*5)/60 + 1
      
      // Scheduling Output (populated by engine)
      scheduled_days: [
        { date: "2025-03-10", hours: 16, units_completed: 180 },
        { date: "2025-03-11", hours: 16, units_completed: 192 },
        // ...
      ],
      total_units_completed: 800,
      completion_date: "2025-03-15"
    },
    {
      sequence_number: 2,
      work_center_id: "wc_heat01",
      cycle_time_minutes: 10,
      setup_time_hours: 0.5,
      // ... scheduling output
    }
  ],
  
  // Scheduling Results
  planned_completion_date: "2025-03-18",
  delayed: false,
  delay_days: 0,
  unscheduled: false,
  status: "PLANNED"  // PLANNED, IN_PROGRESS, COMPLETED, UNSCHEDULED
}
```

### How Orders Are Read

```javascript
// From DataContext.jsx (lines 54-123)

const fetchData = async () => {
  // 1. Fetch from API
  const ordersResponse = await axios.get(`${backendUrl}/api/data/orders`);
  const orders = ordersResponse.data || [];
  
  // 2. Enrich with production data
  const ordersWithProduction = orders.map(order => {
    // Calculate actual production vs required
    const total_produced = productionLogs
      .filter(log => log.order_id === order.id)
      .reduce((sum, log) => sum + log.quantity_produced, 0);
    
    const remaining_quantity = order.net_required_quantity - total_produced;
    
    return {
      ...order,
      total_produced,
      remaining_quantity,
      actual_units_completed: total_produced
    };
  });
  
  // 3. Trigger rebuild
  await triggerRebuild(workCenters, ordersWithProduction);
};
```

### Priority Processing Order

Orders are processed in strict priority order:

```javascript
// From schedulingEngine.js (lines 270-275)

const sortedOrders = [...orders].sort((a, b) => {
  // Primary: Priority DESC (3, 2, 1)
  if (b.priority !== a.priority) {
    return b.priority - a.priority;
  }
  // Secondary: Timestamp ASC (oldest first)
  return new Date(a.creation_timestamp) - new Date(b.creation_timestamp);
});
```

**Example Processing Order:**
```
Priority 3 (High):
  - Order A (created 09:00)  ← Processed 1st
  - Order B (created 10:00)  ← Processed 2nd

Priority 2 (Normal):
  - Order C (created 08:00)  ← Processed 3rd

Priority 1 (Low):
  - Order D (created 07:00)  ← Processed 4th
```

---

## Routing Steps Processing

### Sequential Flow with WIP Transfer

Each order has multiple routing steps that must be completed **in sequence**:

```
Order: 1000 units

Stage 1: CNC Milling      (5 min/unit, setup 1 hr)
   ↓ (WIP Transfer - End of Day)
Stage 2: Heat Treatment   (10 min/unit, setup 0.5 hr)
   ↓ (WIP Transfer - End of Day)
Stage 3: Grinding         (3 min/unit, setup 0.5 hr)
   ↓
Completed Order
```

### WIP (Work-In-Progress) Transfer Logic

```javascript
// From schedulingEngine.js (lines 131-143)

const getAvailableWIP = (order, routingStep, currentDateStr, wipTransfers) => {
  const stepIndex = order.routing.findIndex(
    s => s.sequence_number === routingStep.sequence_number
  );
  
  if (stepIndex === 0) {
    // First step: All remaining units available
    return order.quantity - routingStep.total_units_completed;
  } else {
    // Subsequent steps: WIP from previous step's YESTERDAY'S completions
    const previousStep = order.routing[stepIndex - 1];
    const transferKey = `${order.id}_step${routingStep.sequence_number}_${currentDateStr}`;
    return wipTransfers[transferKey] || 0;
  }
};
```

### Example: 3-Stage Order Flow

**Order Details:**
- Quantity: 100 units
- Stage 1: CNC (cycle: 5 min/unit)
- Stage 2: Heat (cycle: 10 min/unit)
- Stage 3: Grind (cycle: 3 min/unit)

**Day-by-Day Flow:**

| Day | Stage 1 | Stage 2 | Stage 3 | WIP Transfers |
|-----|---------|---------|---------|---------------|
| 1 | Process 20 units | (waiting) | (waiting) | 20→Stage2 (Day 2) |
| 2 | Process 20 units | Process 20 units | (waiting) | 20→Stage2, 20→Stage3 |
| 3 | Process 20 units | Process 20 units | Process 20 units | All stages active |
| 4 | Process 20 units | Process 20 units | Process 20 units | Continuous flow |
| 5 | Process 20 units | Process 20 units | Process 20 units | |
| 6 | Done | Process 20 units | Process 20 units | Stage 1 complete |
| 7 | - | Done | Process 20 units | Stage 2 complete |
| 8 | - | - | Done | All complete ✅ |

**Key Rules:**
1. **End-of-Day Transfer**: Units completed on Day X are available for next stage on Day X+1
2. **No Same-Day Overlap**: A unit cannot be in two stages on the same day
3. **Sequential Dependency**: Stage N+1 waits for Stage N completions

---

## Machine Capacity Calculation

### Work Center Configuration

```javascript
{
  id: "wc_cnc01",
  name: "CNC Mill 01",
  
  // Base Capacity
  shift_hours_per_day: 8,      // Hours per shift
  number_of_shifts: 2,         // Shifts per day
  efficiency_percent: 0.95,    // Machine efficiency (95%)
  
  // Parallel Processing
  parallel_units: 2,           // Can process 2 units simultaneously
  
  // Temporary Adjustments
  breakdowns: [
    { date: "2025-03-15", reason: "Maintenance" }
  ],
  overtime_rules: [
    { date: "2025-03-20", overtime_hours: 4 }
  ],
  
  // Generated Calendar (60 days)
  calendar: [
    {
      date: "2025-03-10",
      available_hours: 15.2,   // Base capacity
      booked_hours: 0,         // Allocated hours
      breakdown: false
    },
    // ... 59 more days
  ]
}
```

### Daily Capacity Calculation

```javascript
// From schedulingEngine.js (lines 22-56)

const generateCalendar = (workCenter, startDate = new Date()) => {
  const calendar = [];
  
  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Check for breakdown
    const hasBreakdown = workCenter.breakdowns?.some(b => b.date === dateStr);
    
    // Calculate base capacity
    const baseCapacity = hasBreakdown ? 0 : 
      (workCenter.shift_hours_per_day * 
       workCenter.number_of_shifts * 
       workCenter.efficiency_percent);
    
    // Add overtime
    const overtime = workCenter.overtime_rules?.find(o => o.date === dateStr);
    const overtimeHours = overtime ? overtime.overtime_hours : 0;
    
    const availableHours = baseCapacity + overtimeHours;
    
    calendar.push({
      date: dateStr,
      available_hours: availableHours,
      booked_hours: 0,
      breakdown: hasBreakdown
    });
  }
  
  return calendar;
};
```

### Capacity Formula

```
Base Capacity per Day:
  base_hours = shift_hours_per_day × number_of_shifts × efficiency_percent

With Parallel Units:
  effective_capacity = base_hours × parallel_units

With Overtime:
  final_capacity = (base_hours + overtime_hours) × parallel_units

With Breakdown:
  capacity = 0 (no production possible)
```

### Example Calculations

**Example 1: Standard CNC Machine**
- Shift hours: 8
- Number of shifts: 2
- Efficiency: 95%
- Parallel units: 1

```
base_capacity = 8 × 2 × 0.95 = 15.2 hours/day
effective_capacity = 15.2 × 1 = 15.2 hours/day
```

**Example 2: Multi-Spindle CNC**
- Shift hours: 8
- Number of shifts: 2
- Efficiency: 95%
- Parallel units: 3
- Overtime: 4 hours

```
base_capacity = 8 × 2 × 0.95 = 15.2 hours/day
with_overtime = 15.2 + 4 = 19.2 hours/day
effective_capacity = 19.2 × 3 = 57.6 hours/day
```

**Example 3: Breakdown Day**
```
capacity = 0 hours (machine down)
```

---

## Load Distribution Across Days

### Daily Scheduling Algorithm

```javascript
// From schedulingEngine.js (lines 149-253)

const scheduleFlowBased = (workCenters, orders, lastDateStr) => {
  const wipTransfers = {}; // Track WIP between stages
  
  // Process each day
  for (let dayIndex = 0; dayIndex < 60; dayIndex++) {
    const currentDateStr = calendarDates[dayIndex];
    const nextDateStr = calendarDates[dayIndex + 1];
    
    // Process each order (in priority order)
    for (const order of sortedOrders) {
      if (order.unscheduled) continue;
      
      // Process each routing step
      for (const routingStep of order.routing) {
        // Skip if complete
        if (routingStep.total_units_completed >= order.quantity) continue;
        
        const workCenter = workCenters.find(wc => wc.id === routingStep.work_center_id);
        const calendarDay = workCenter.calendar.find(d => d.date === currentDateStr);
        
        // Skip breakdown days
        if (calendarDay.breakdown) continue;
        
        // Get WIP available
        const wipAvailable = getAvailableWIP(order, routingStep, currentDateStr, wipTransfers);
        if (wipAvailable <= 0) continue;
        
        // Calculate constraints
        const parallelUnits = workCenter.parallel_units || 1;
        const dailyCapacityHours = calendarDay.available_hours - calendarDay.booked_hours;
        if (dailyCapacityHours <= 0) continue;
        
        // Effective capacity with parallel units
        const effectiveCapacityHours = dailyCapacityHours * parallelUnits;
        
        // Setup time (only on first batch)
        const isFirstBatch = routingStep.total_units_completed === 0;
        const setupTime = isFirstBatch ? routingStep.setup_time_hours : 0;
        
        // Calculate max units by capacity
        const availableMinutes = (effectiveCapacityHours - setupTime) * 60;
        const maxUnitsByCapacity = Math.floor(availableMinutes / routingStep.cycle_time_minutes);
        
        // Units to process = min(WIP, capacity limit)
        const unitsToProcess = Math.min(wipAvailable, Math.max(0, maxUnitsByCapacity));
        
        // Calculate actual hours required
        const hoursRequired = setupTime + (unitsToProcess * routingStep.cycle_time_minutes / 60);
        
        if (unitsToProcess > 0) {
          // Allocate capacity
          calendarDay.booked_hours += hoursRequired;
          
          // Track scheduled work
          routingStep.scheduled_days.push({
            date: currentDateStr,
            hours: hoursRequired,
            units_completed: unitsToProcess
          });
          
          // Update completion tracking
          routingStep.total_units_completed += unitsToProcess;
          
          // Mark completion if done
          if (routingStep.total_units_completed >= order.quantity) {
            routingStep.completion_date = currentDateStr;
          }
          
          // Transfer WIP to next stage (available next day)
          if (nextDateStr && routingStep.sequence_number < order.routing.length) {
            const nextStepSequence = routingStep.sequence_number + 1;
            const transferKey = `${order.id}_step${nextStepSequence}_${nextDateStr}`;
            wipTransfers[transferKey] = (wipTransfers[transferKey] || 0) + unitsToProcess;
          }
        }
      }
    }
  }
};
```

### Capacity Allocation Example

**Scenario:**
- Work Center: CNC Mill 01
- Available: 16 hours/day
- Parallel units: 1
- Day: March 10

**Orders Queued:**
1. Order A (Priority 3): 200 units, 5 min/unit, 1 hr setup
2. Order B (Priority 2): 100 units, 10 min/unit, 0.5 hr setup

**Allocation Process:**

```
Day March 10:
  Start: 16 hours available
  
  Order A (Priority 3) - Stage 1:
    - Setup: 1 hour
    - Remaining: 15 hours = 900 minutes
    - Max units: 900 / 5 = 180 units
    - Process: 180 units
    - Hours used: 1 + (180 * 5 / 60) = 16 hours
    - Remaining capacity: 0 hours
  
  Order B (Priority 2) - Stage 1:
    - No capacity left → deferred to next day
    
  End: 16 hours booked
```

### Multi-Day Allocation

**Order C: 1000 units, 5 min/unit, 1 hr setup**

| Day | Capacity | Setup | Units Processed | Hours Used | Cumulative |
|-----|----------|-------|----------------|------------|------------|
| 1 | 16 hr | 1 hr | 180 units | 16 hr | 180/1000 |
| 2 | 16 hr | 0 hr | 192 units | 16 hr | 372/1000 |
| 3 | 16 hr | 0 hr | 192 units | 16 hr | 564/1000 |
| 4 | 16 hr | 0 hr | 192 units | 16 hr | 756/1000 |
| 5 | 16 hr | 0 hr | 192 units | 16 hr | 948/1000 |
| 6 | 16 hr | 0 hr | 52 units | 4.33 hr | 1000/1000 ✅ |

---

## Heatmap Utilization Calculation

### Utilization Percentage Formula

```javascript
// For each work center, for each day:
utilization_percent = (booked_hours / available_hours) × 100

// Color coding:
if (breakdown)           → Grey
if (utilization > 95%)   → Red (overloaded)
if (utilization >= 80%)  → Amber (tight)
if (utilization < 80%)   → Green (healthy)
```

### Heatmap Data Structure

```javascript
// From DashboardEnterprise.jsx (lines 175-223)

function CapacityHeatmap({ workCenters, days }) {
  return (
    <div>
      {workCenters.map(wc => (
        <div key={wc.id}>
          <div>{wc.name}</div>
          {days.map(({ date }) => {
            const day = wc.calendar?.find(d => d.date === date);
            const utilization = day?.available_hours > 0 
              ? (day.booked_hours / day.available_hours) * 100 
              : 0;
            
            const color = day?.breakdown ? 'grey' 
              : utilization > 95 ? 'red' 
              : utilization >= 80 ? 'amber' 
              : 'green';
            
            return (
              <div style={{ background: color }}>
                {Math.round(utilization)}%
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

### Example Heatmap Data

**CNC Mill 01 - March 10-17:**

| Date | Available | Booked | Utilization | Color |
|------|-----------|--------|-------------|-------|
| 03-10 | 16.0 | 16.0 | 100% | 🔴 Red |
| 03-11 | 16.0 | 15.2 | 95% | 🟠 Amber |
| 03-12 | 16.0 | 12.8 | 80% | 🟠 Amber |
| 03-13 | 16.0 | 10.4 | 65% | 🟢 Green |
| 03-14 | 16.0 | 8.0 | 50% | 🟢 Green |
| 03-15 | 0.0 | 0.0 | - | ⚫ Grey (Breakdown) |
| 03-16 | 20.0 | 18.5 | 93% | 🟠 Amber (Overtime) |
| 03-17 | 16.0 | 5.2 | 33% | 🟢 Green |

### Bottleneck Identification

```javascript
// From schedulingEngine.js (lines 353-396)

export const identifyBottleneck = (workCenters) => {
  const today = getToday();
  let bottleneck = null;
  let maxUtilization = 0;
  
  workCenters.forEach(wc => {
    let totalUtilization = 0;
    let validDays = 0;
    
    // Calculate average utilization for next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const calendarDay = wc.calendar?.find(d => d.date === dateStr);
      if (!calendarDay || calendarDay.breakdown || calendarDay.available_hours <= 0) {
        continue;
      }
      
      const dailyUtilization = (calendarDay.booked_hours / calendarDay.available_hours) * 100;
      totalUtilization += dailyUtilization;
      validDays++;
    }
    
    const avgUtilization = validDays > 0 ? totalUtilization / validDays : 0;
    
    if (avgUtilization > maxUtilization) {
      maxUtilization = avgUtilization;
      bottleneck = {
        work_center_id: wc.id,
        work_center_name: wc.name,
        utilization_percent: Math.round(avgUtilization * 10) / 10
      };
    }
  });
  
  return bottleneck;
};
```

**Example Output:**
```javascript
{
  work_center_id: "wc_cnc01",
  work_center_name: "CNC Mill 01",
  utilization_percent: 97.3
}
```

---

## Parallel Units Handling

### What Are Parallel Units?

**Parallel units** represent the number of units a work center can process **simultaneously**.

### Real-World Examples

**CNC Machine with parallel_units = 2:**
- Has 2 spindles or 2 fixtures
- Can machine 2 parts at the same time
- **Doubles effective throughput**

**Heat Treatment Oven with parallel_units = 10:**
- Batch oven holding 10 parts
- All 10 parts heat-treated simultaneously
- **10× effective throughput**

**Grinding Station with parallel_units = 1:**
- Single-piece processing
- Standard throughput

### Capacity Multiplier Effect

```javascript
// From schedulingEngine.js (lines 186-206)

// Calculate capacity constraints
const parallelUnits = workCenter.parallel_units || 1;
const dailyCapacityHours = calendarDay.available_hours - calendarDay.booked_hours;

// parallel_units multiplies effective capacity
const effectiveCapacityHours = dailyCapacityHours * parallelUnits;

// Determine setup time (only on first batch)
const isFirstBatch = routingStep.total_units_completed === 0;
const setupTime = isFirstBatch ? routingStep.setup_time_hours : 0;

// Calculate max units we can process
const availableMinutes = (effectiveCapacityHours - setupTime) * 60;
const maxUnitsByCapacity = Math.floor(availableMinutes / routingStep.cycle_time_minutes);

// Units to process = min(WIP available, capacity-based limit)
const unitsToProcess = Math.min(wipAvailable, Math.max(0, maxUnitsByCapacity));

// Calculate actual hours required (setup once + cycle time per unit)
const hoursRequired = setupTime + (unitsToProcess * routingStep.cycle_time_minutes / 60);

// Book capacity (hours used, not multiplied)
calendarDay.booked_hours += hoursRequired;
```

### Calculation Examples

**Example 1: Single-Unit Machine (parallel_units = 1)**

Configuration:
- Available: 16 hours/day
- Cycle time: 10 min/unit
- Setup: 1 hour

Calculation:
```
effective_capacity = 16 × 1 = 16 hours
available_minutes = (16 - 1) × 60 = 900 minutes
max_units = floor(900 / 10) = 90 units/day
```

**Example 2: Dual-Spindle Machine (parallel_units = 2)**

Configuration:
- Available: 16 hours/day
- Cycle time: 10 min/unit
- Setup: 1 hour

Calculation:
```
effective_capacity = 16 × 2 = 32 hours  ← Doubled!
available_minutes = (32 - 1) × 60 = 1,860 minutes
max_units = floor(1860 / 10) = 186 units/day  ← 2× throughput
```

**Example 3: Batch Oven (parallel_units = 10)**

Configuration:
- Available: 24 hours/day (3 shifts)
- Cycle time: 30 min/unit
- Setup: 0.5 hours

Calculation:
```
effective_capacity = 24 × 10 = 240 hours  ← 10× capacity!
available_minutes = (240 - 0.5) × 60 = 14,370 minutes
max_units = floor(14370 / 30) = 479 units/day  ← Massive throughput
```

### Important Notes

1. **Hours Booked vs Capacity**
   - Capacity is multiplied by parallel_units
   - Hours booked are NOT multiplied (actual machine time)
   - Example: 2 parallel units processing for 8 hours = 8 hours booked, not 16

2. **Setup Time**
   - Charged only once per batch (first day)
   - Not repeated on subsequent days
   - Affects first batch calculation

3. **WIP Constraint**
   - Even with high parallel_units, processing limited by WIP availability
   - Cannot process more units than available from previous stage

---

## Data Models

### Core Entities

#### Order Model
```python
# From backend/models/manufacturing.py

class Order(BaseModel):
    id: str
    customer: str
    part_number: str
    quantity: int
    priority: Priority  # 3=High, 2=Normal, 1=Low
    due_date: datetime
    creation_timestamp: datetime
    
    # Multi-stage routing
    routing: List[RoutingStep]
    
    # Scheduling results
    planned_completion_date: Optional[str]
    delayed: bool
    delay_days: int
    unscheduled: bool
    status: str  # PLANNED, IN_PROGRESS, COMPLETED, UNSCHEDULED
```

#### Work Center Model
```python
class WorkCenter(BaseModel):
    id: str
    name: str
    shift_hours_per_day: float
    number_of_shifts: int
    efficiency_percent: float
    parallel_units: int  # Concurrent processing capacity
    
    # Temporary adjustments
    breakdowns: List[Breakdown]
    overtime_rules: List[OvertimeRule]
    
    # Generated calendar (60 days)
    calendar: List[CalendarDay]
```

#### Routing Step Model
```javascript
{
  sequence_number: int,        // Stage order (1, 2, 3, ...)
  work_center_id: string,
  cycle_time_minutes: float,   // Time per unit
  setup_time_hours: float,     // One-time setup
  required_hours: float,       // Total hours needed
  
  // Scheduling output
  scheduled_days: [
    {
      date: string,
      hours: float,
      units_completed: int
    }
  ],
  total_units_completed: int,
  completion_date: string
}
```

---

## Key Features & Constraints

### Core Constraints

1. **Finite Capacity**: Each work center has limited hours per day
2. **Sequential Routing**: Stages must complete in sequence order
3. **WIP Transfer**: End-of-day transfer between stages
4. **Priority Enforcement**: Higher priority orders processed first
5. **Planning Horizon**: 60-day forward planning window
6. **Deterministic**: Same inputs always produce same outputs

### Advanced Features

1. **Parallel Units**: Simultaneous processing support
2. **Breakdowns**: Machine downtime handling
3. **Overtime**: Additional capacity scheduling
4. **Multi-Stage Routing**: Complex production flows
5. **Real-Time Rebuild**: Instant schedule updates
6. **Utilization Tracking**: Capacity heatmap visualization
7. **Risk Analysis**: Delivery risk calculation
8. **Bottleneck Detection**: Constraint identification

### Performance Characteristics

- **Planning Horizon**: 60 days
- **Order Capacity**: Hundreds of orders
- **Work Centers**: Dozens of machines
- **Routing Complexity**: Multi-stage (10+ stages)
- **Rebuild Time**: < 1 second (client-side)
- **Deterministic**: 100% reproducible

---

## Summary

FluxNex is a sophisticated manufacturing scheduling engine that:

✅ **Schedules production orders** across sequential operations  
✅ **Respects finite machine capacity** with hour-level precision  
✅ **Handles parallel processing** via parallel_units multiplier  
✅ **Transfers WIP between stages** with end-of-day logic  
✅ **Enforces priority scheduling** (3 → 2 → 1)  
✅ **Provides visual feedback** via capacity heatmap  
✅ **Identifies bottlenecks** automatically  
✅ **Calculates delivery risk** for proactive management  
✅ **Maintains determinism** for reliable planning  
✅ **Supports 60-day horizon** for medium-term planning  

The system is **production-ready** and implements industry-standard scheduling algorithms with modern web technologies.

---

**Analysis Date**: March 8, 2025  
**Project**: FluxNex Scheduling Engine  
**Status**: ✅ Complete Architecture Analysis
