# Parallel Units Logic Fix - schedulingEngine.js

## Issue Fixed
The scheduling engine was incorrectly treating `parallel_units` as a daily production limit rather than a capacity multiplier.

---

## Problem Description

### Before (INCORRECT):
```javascript
// Wrong: Limited daily production to parallel_units count
for (let testUnits = Math.min(wipAvailable, parallelUnits); testUnits > 0; testUnits--) {
  const testHours = calculateHoursForUnits(routingStep, testUnits, isFirstBatch);
  if (testHours <= availableCapacityHours) {
    unitsToProcess = testUnits;
    hoursRequired = testHours;
    break;
  }
}
```

**Problem:** If `parallel_units = 2`, the system could only process a maximum of 2 units per day, regardless of available capacity hours.

**Example Failure:**
- Work Center: 16 hours/day available, parallel_units = 2
- Cycle time: 0.5 minutes/unit
- **Wrong Result:** Max 2 units/day (artificially capped)
- **Should Be:** Max ~3,840 units/day (16 hours × 2 × 60 min ÷ 0.5 min)

---

## Solution Implemented

### After (CORRECT):
```javascript
// parallel_units multiplies effective capacity
const effectiveCapacityHours = dailyCapacityHours * parallelUnits;

// Determine if this is first batch (setup time applies)
const isFirstBatch = routingStep.total_units_completed === 0;
const setupTime = isFirstBatch ? routingStep.setup_time_hours : 0;

// Calculate max units we can process based on capacity
// Available time (in minutes) minus setup time
const availableMinutes = (effectiveCapacityHours - setupTime) * 60;
const maxUnitsByCapacity = Math.floor(availableMinutes / routingStep.cycle_time_minutes);

// Units to process = min(WIP available, capacity-based limit)
const unitsToProcess = Math.min(wipAvailable, Math.max(0, maxUnitsByCapacity));

// Calculate actual hours required (setup once + cycle time per unit)
const hoursRequired = setupTime + (unitsToProcess * routingStep.cycle_time_minutes / 60);
```

---

## What `parallel_units` Means (Correct Definition)

**parallel_units = Capacity Multiplier**

This represents how many units can be processed **simultaneously** on the work center.

### Real-World Examples:

**CNC Machine with parallel_units = 2:**
- Has 2 spindles or fixtures
- Can machine 2 parts at the same time
- If cycle time is 10 minutes/unit:
  - In 10 minutes: completes 2 units (not 1)
  - In 1 hour: completes 12 units (not 6)
  - **Effective capacity = 2× base capacity**

**Heat Treatment Oven with parallel_units = 10:**
- Can heat-treat 10 parts simultaneously
- If cycle time is 30 minutes/unit:
  - In 30 minutes: completes 10 units
  - In 8-hour shift: completes 160 units
  - **Effective capacity = 10× base capacity**

---

## Calculation Logic (Fixed)

### Step 1: Calculate Effective Capacity
```
daily_capacity_hours = calendar_available_hours - already_booked_hours
effective_capacity_hours = daily_capacity_hours × parallel_units
```

### Step 2: Account for Setup Time (First Batch Only)
```
setup_time = (first_batch) ? routing_step.setup_time_hours : 0
available_minutes = (effective_capacity_hours - setup_time) × 60
```

### Step 3: Calculate Maximum Units by Capacity
```
max_units_by_capacity = floor(available_minutes / cycle_time_minutes)
```

### Step 4: Determine Units to Process
```
units_to_process = min(WIP_available, max_units_by_capacity)
```

### Step 5: Calculate Actual Hours Consumed
```
hours_required = setup_time + (units_to_process × cycle_time_minutes / 60)
booked_hours += hours_required  // Book only actual hours, not multiplied
```

---

## Example Scenarios (After Fix)

### Scenario 1: CNC Mill
- **Configuration:**
  - Available: 8 hours/day
  - parallel_units: 2
  - Cycle time: 5 minutes/unit
  - Setup time: 1 hour

- **Day 1 Calculation:**
  ```
  effective_capacity = 8 hours × 2 = 16 hours
  available_minutes = (16 - 1 setup) × 60 = 900 minutes
  max_units = floor(900 / 5) = 180 units
  ```
  **Result:** Can process up to 180 units on Day 1 ✅

### Scenario 2: Heat Treatment
- **Configuration:**
  - Available: 24 hours/day (3 shifts)
  - parallel_units: 1
  - Cycle time: 2 minutes/unit
  - Setup time: 0.5 hours

- **Day 1 Calculation:**
  ```
  effective_capacity = 24 hours × 1 = 24 hours
  available_minutes = (24 - 0.5) × 60 = 1,410 minutes
  max_units = floor(1410 / 2) = 705 units
  ```
  **Result:** Can process up to 705 units on Day 1 ✅

### Scenario 3: Grinding (Multiple Units)
- **Configuration:**
  - Available: 16 hours/day
  - parallel_units: 3
  - Cycle time: 0.5 minutes/unit
  - Setup time: 2 hours

- **Day 1 Calculation:**
  ```
  effective_capacity = 16 hours × 3 = 48 hours
  available_minutes = (48 - 2) × 60 = 2,760 minutes
  max_units = floor(2760 / 0.5) = 5,520 units
  ```
  **Result:** Can process up to 5,520 units on Day 1 ✅

---

## Impact of Fix

### Before Fix (BROKEN):
- ❌ parallel_units = 2 → max 2 units/day
- ❌ parallel_units = 10 → max 10 units/day
- ❌ Large orders never completed
- ❌ Massive artificial bottlenecks

### After Fix (CORRECT):
- ✅ parallel_units = 2 → **2× capacity** (doubles throughput)
- ✅ parallel_units = 10 → **10× capacity** (10× throughput)
- ✅ Large orders complete as expected
- ✅ Realistic production schedules

---

## What Was NOT Changed

✅ WIP transfer logic (end-of-day transfer still works)
✅ Routing sequence logic (steps still sequential)
✅ Priority sorting (DESC by priority, ASC by timestamp)
✅ Planning horizon (60 days)
✅ Breakdown handling
✅ Overtime support
✅ Deterministic behavior
✅ All exported functions
✅ UI components

---

## Technical Details

### File Modified:
- `/app/frontend/src/services/schedulingEngine.js`

### Lines Changed:
- Lines 181-206 (scheduling capacity calculation)

### Functions Affected:
- `scheduleFlowBased()` - Fixed parallel units calculation

### Functions Unchanged:
- `calculateHoursForUnits()` - Still available (kept for reference)
- `getAvailableWIP()` - No changes
- `rebuildSchedule()` - No changes
- All helper functions - No changes

---

## Verification Steps

To verify the fix works correctly:

1. **Create a test order:**
   - Quantity: 100 units
   - Cycle time: 5 minutes/unit
   - Work center with parallel_units = 2

2. **Expected Result:**
   - Should process more than 2 units per day
   - Should complete based on capacity calculation
   - Should respect effective capacity (base × 2)

3. **Check scheduled_days:**
   - Should show realistic daily completions
   - Should track units_completed correctly
   - Should show proper hours consumed

---

## Summary

**The Fix:**
Changed `parallel_units` from a hard daily limit to a proper capacity multiplier.

**The Math:**
```
OLD: max_units_per_day = parallel_units  ❌
NEW: effective_capacity = base_capacity × parallel_units  ✅
```

**The Impact:**
- Large orders now complete correctly
- parallel_units now provides realistic throughput increase
- Scheduling matches real manufacturing behavior

---

*Fixed on: February 24, 2025*
*Status: ✅ COMPLETE*
