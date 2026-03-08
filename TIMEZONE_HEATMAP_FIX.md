# Dashboard Timezone and Heatmap Fix - Summary

## Issues Fixed

### Issue #1: Incorrect Dashboard Date (UTC instead of IST)
**Problem:** Dashboard displayed "Today's Date" in UTC timezone instead of Indian Standard Time (IST, UTC+5:30).

**Example:**
- User in India at 2:00 AM IST on March 9
- Dashboard showed March 8 (UTC date)
- Should show March 9 (IST date)

### Issue #2: Heatmap Starting from Tomorrow
**Problem:** The 14-Day Capacity Heatmap started from tomorrow instead of today.

**Expected:** TODAY + next 13 days = 14 days total
**Actual:** Tomorrow + next 13 days (missing today's data)

## Root Cause Analysis

### Cause #1: UTC Date Conversion
The `getToday()` function in schedulingEngine.js was using local browser time but converting to ISO string (UTC):

```javascript
// ❌ OLD CODE
export const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Later used as:
today.toISOString().split('T')[0];  // ❌ Converts to UTC date
```

**Problem:** 
- Browser creates Date object in local time
- `.toISOString()` converts to UTC
- IST is UTC+5:30, so dates after 18:30 IST show next day in UTC
- Before 5:30 AM IST shows previous day in UTC

### Cause #2: Dashboard Date Display
Dashboard was using UTC conversion for display:

```javascript
// ❌ OLD CODE
today={today.toISOString().split('T')[0]}
```

### Cause #3: Calendar Generation
All date generation used `.toISOString().split('T')[0]` which converts to UTC.

## Solution Implemented

### Fix #1: IST-Aware getToday() Function

**New Implementation (schedulingEngine.js, lines 68-81):**
```javascript
/**
 * Get today's date in IST (Indian Standard Time, UTC+5:30)
 * Normalized to midnight IST
 */
export const getToday = () => {
  // Get current time in IST
  const now = new Date();
  
  // Convert to IST by adding 5.5 hours to UTC
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const istTime = new Date(utcTime + istOffset);
  
  // Normalize to midnight IST
  istTime.setHours(0, 0, 0, 0);
  
  return istTime;
};
```

**How it works:**
1. Gets current browser time
2. Converts to UTC (accounting for browser timezone)
3. Adds 5.5 hours (IST offset)
4. Normalizes to midnight IST
5. Returns Date object representing today in IST

### Fix #2: IST Date Formatting Helper

**New Function (schedulingEngine.js, lines 102-108):**
```javascript
/**
 * Format date as YYYY-MM-DD in IST timezone
 */
export const formatDateIST = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

**Why needed:**
- Avoids `.toISOString()` which converts to UTC
- Uses Date object's local values (which are now IST from getToday())
- Returns consistent YYYY-MM-DD format

### Fix #3: Updated Calendar Generation

**Modified Function (schedulingEngine.js, lines 22-56):**
```javascript
export const generateCalendar = (workCenter, startDate = null) => {
  const calendar = [];
  const today = startDate ? new Date(startDate) : getToday();  // ✅ Uses IST
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < PLANNING_HORIZON_DAYS; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = formatDateIST(date);  // ✅ Uses IST formatting
    
    // ... rest of logic
  }
}
```

### Fix #4: Updated Scheduling Engine

**All date conversions now use formatDateIST():**

1. **rebuildSchedule** (line 287):
   ```javascript
   const lastDateStr = formatDateIST(lastCalendarDate);  // ✅ IST
   ```

2. **scheduleFlowBased** (line 178):
   ```javascript
   calendarDates.push(formatDateIST(date));  // ✅ IST
   ```

3. **identifyBottleneck** (line 387):
   ```javascript
   const dateStr = formatDateIST(date);  // ✅ IST
   ```

### Fix #5: Updated Dashboard Display

**Modified Dashboard (DashboardEnterprise.jsx):**

1. **Import new helper:**
   ```javascript
   import { formatDateIST } from '../services/schedulingEngine';
   ```

2. **Generate heatmap with IST dates:**
   ```javascript
   // Generate heatmap days: TODAY + next 13 days = 14 days total
   const heatmapDays = [];
   for (let i = 0; i < 14; i++) {
     const date = new Date(today);
     date.setDate(date.getDate() + i);
     heatmapDays.push({ 
       date: formatDateIST(date),   // ✅ IST formatting
       dayNum: date.getDate() 
     });
   }
   ```

3. **Display today's date in IST:**
   ```javascript
   <ContextBar 
     today={formatDateIST(today)}  // ✅ Shows IST date
     ...
   />
   ```

## Verification Examples

### Example 1: IST Date Conversion

**Scenario:** User in India at 11:30 PM IST on March 8
- Browser local time: March 8, 23:30 IST
- UTC time: March 8, 18:00 UTC

**Old Behavior:**
- `getToday()` → March 8 (local)
- `.toISOString()` → "2025-03-08T18:00:00.000Z"
- Dashboard shows: **March 8** ❌ (should be March 9 in UTC logic, but confusing)

**New Behavior:**
- `getToday()` calculates IST → March 8
- `formatDateIST()` → "2025-03-08"
- Dashboard shows: **March 8** ✅ (correct IST date)

### Example 2: Early Morning IST

**Scenario:** User at 2:00 AM IST on March 9
- Browser local time: March 9, 02:00 IST
- UTC time: March 8, 20:30 UTC

**Old Behavior:**
- Dashboard might show: **March 8** ❌ (UTC date)

**New Behavior:**
- `getToday()` → March 9 (IST)
- Dashboard shows: **March 9** ✅

### Example 3: Heatmap Coverage

**Old Behavior:**
- Day 0: Tomorrow (missing today)
- Day 1: Tomorrow + 1
- ...
- Day 13: Tomorrow + 13

**New Behavior:**
- Day 0: **TODAY** ✅
- Day 1: TODAY + 1
- ...
- Day 13: TODAY + 13

**Result:** Full 14-day window from today

## What Changed vs. What Stayed Same

### ✅ Changed (Fixed):
1. `getToday()` now returns IST-based date
2. All date formatting uses `formatDateIST()` instead of `.toISOString()`
3. Dashboard displays IST dates
4. Heatmap includes today's date
5. All calendar generation uses IST

### ✅ Unchanged (As Required):
1. Scheduling algorithm logic - **No changes**
2. Order processing - **No changes**
3. Capacity calculations - **No changes**
4. WIP transfer logic - **No changes**
5. Priority sorting - **No changes**
6. Database schema - **No changes**
7. API endpoints - **No changes**
8. UI layout - **No changes**

## Files Modified

| File | Lines Modified | Changes |
|------|----------------|---------|
| `frontend/src/services/schedulingEngine.js` | 68-81, 102-108, 22-56, 169-178, 278-287, 373-387 | IST timezone logic, formatDateIST helper |
| `frontend/src/pages/DashboardEnterprise.jsx` | 1-10, 24-50 | Import formatDateIST, use IST dates in display |

**Total Changes:** 2 files, ~50 lines modified/added

## Testing Checklist

### Dashboard Date Display
1. ✅ Open dashboard at different times of day
2. ✅ Verify "Today's Date" shows correct IST date
3. ✅ Test at edge times:
   - Before 5:30 AM IST (would be previous day UTC)
   - After 6:30 PM IST (would be next day UTC)

### Heatmap Coverage
1. ✅ Verify heatmap shows 14 columns
2. ✅ First column = Today's date (matches dashboard date)
3. ✅ Today's column shows capacity utilization data
4. ✅ Last column = Today + 13 days

### Scheduling Consistency
1. ✅ Orders scheduled with correct dates
2. ✅ Calendar breakdowns match configured dates
3. ✅ Overtime rules applied on correct dates
4. ✅ Bottleneck calculation uses correct 7-day window

## Known Behaviors

### Date Storage in Database
- Dates stored in MongoDB remain as strings (YYYY-MM-DD format)
- No changes to database date format
- IST conversion happens only in frontend display and calculations

### Browser Timezone Independence
- System now ignores browser timezone setting
- All users see IST dates regardless of browser/OS timezone
- Consistent experience for all users

### Scheduling Horizon
- Still uses 60-day planning horizon
- All 60 days calculated in IST
- No changes to planning duration

## Summary

**Problem:** Dashboard showed UTC dates, heatmap missed today
**Solution:** Implemented IST timezone awareness throughout the system
**Impact:** 
- ✅ Dashboard shows correct IST dates
- ✅ Heatmap includes today's data
- ✅ Consistent date handling across all features
- ✅ No changes to core scheduling logic

**Status:** ✅ Fixed and Deployed

All date/time displays now use Indian Standard Time (UTC+5:30) consistently throughout the application.
