# FluxNex - Manufacturing Scheduling Application

## Original Problem Statement
Manufacturing scheduling application with React frontend and FastAPI backend. Core scheduling logic is client-side in `schedulingEngine.js`.

## What's Been Implemented

### Session - March 10, 2026
**Bug Fixes Applied to `/app/fluxnex-project/frontend/src/services/schedulingEngine.js`:**

1. **Bug 1 Fix - accountForActualProduction routing step lookup:**
   - Changed from always using `order.routing[0]` to finding correct routing step
   - Priority: `log.work_center_id` → `log.routing_step_sequence` → fallback to first step
   - Added seeding of `total_units_completed` from production logs (netGood = produced - rejected)

2. **Bug 2 Fix - getAvailableWIP negative WIP prevention:**
   - Added `Math.max(0, remaining)` to prevent negative WIP when production exceeds scheduled quantity

### Previous Session Fixes (Completed)
- Authentication (login/register)
- Order editing logic
- IST timezone handling
- Capacity overbooking fix
- Production logging integration
- UI cleanup (removed "Create Order" button from dashboard)

## Architecture
```
/app/fluxnex-project/
├── backend/ (FastAPI + MongoDB)
└── frontend/
    └── src/
        ├── services/schedulingEngine.js  ← Core scheduling logic
        ├── contexts/DataContext.js
        └── pages/DashboardEnterprise.jsx
```

## Key Technical Notes
- **Scheduling is CLIENT-SIDE** in `schedulingEngine.js`
- **IST timezone (UTC+5:30)** required for all date operations
- **Execution order in rebuildSchedule:** resetSchedulingData → accountForActualProduction → scheduleFlowBased

## Backlog
- P2: Refactor `schedulingEngine.js` (500+ lines) into smaller modules

## App URL
https://production-capacity.preview.emergentagent.com
