# FluxNex - Manufacturing Scheduling Application

## Original Problem Statement
Manufacturing scheduling application with React frontend and FastAPI backend. Core scheduling logic is client-side in `schedulingEngine.js`.

## What's Been Implemented

### Session - March 11, 2026
**Multi-Part Order Feature:**

1. **Create Order Form** - Updated to support multiple parts per order:
   - "Parts in Order" section with searchable part dropdown + quantity input
   - Red × remove button (disabled when only 1 row)
   - Green "+ Add Part" button to add new rows
   - "Create New Part" option in dropdown

2. **Edit Order Form** - Same multi-part support:
   - Pre-populates with existing parts data
   - Allows adding/removing parts

3. **Orders List Page** - Shows stacked parts:
   ```
   SI20225153 × 10,000
   SI20225154 × 8,000
   ```

4. **DataContext Scheduler Integration**:
   - `expandMultiPartOrders()` function expands multi-part orders into separate schedulable entries
   - Each part gets its routing from Part Master
   - Results are collapsed back for display

**Data Structure:**
```json
{
  "customer": "DANA",
  "priority": 2,
  "start_date": "2026-03-11",
  "due_date": "2026-03-13",
  "parts": [
    { "part_id": "abc", "part_number": "SI20225153", "quantity": 10000 },
    { "part_id": "def", "part_number": "SI20225154", "quantity": 8000 }
  ]
}
```

### Previous Session Fixes (Completed)
- Authentication (login/register)
- Order editing logic
- IST timezone handling
- Capacity overbooking fix
- Production logging integration
- Scheduling engine bug fixes (accountForActualProduction, getAvailableWIP, parallel_units)

## Architecture
```
/app/fluxnex-project/
├── backend/ (FastAPI + MongoDB)
└── frontend/
    └── src/
        ├── services/schedulingEngine.js  ← Core scheduling logic
        ├── context/DataContext.jsx       ← Order expansion for scheduling
        └── pages/Orders.jsx              ← Multi-part UI
```

## Key Technical Notes
- **Scheduling is CLIENT-SIDE** in `schedulingEngine.js`
- **IST timezone (UTC+5:30)** required for all date operations
- **Multi-part orders** are expanded before scheduling, collapsed after

## Backlog
- P2: Refactor `schedulingEngine.js` (500+ lines) into smaller modules

## App URL
https://production-capacity.preview.emergentagent.com
