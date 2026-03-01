/**
 * FluxNex - Deterministic Finite Capacity Multi-Stage Flow-Based Scheduling Engine
 * 
 * Core scheduling algorithm that:
 * - Schedules orders across sequential operations with flow-based WIP transfer
 * - Supports parallel_units for concurrent processing
 * - Respects finite daily machine capacity
 * - Enforces priority queues and routing dependencies
 * - Produces identical output for identical input (deterministic)
 * 
 * Key Features:
 * - Flow-based scheduling: Units flow between stages as they complete
 * - End-of-day WIP transfer: Units completed on Day X available for next stage on Day X+1
 * - Parallel units: Work centers can process multiple units simultaneously
 */

const PLANNING_HORIZON_DAYS = 60;

/**
 * Generate calendar for a work center
 */
export const generateCalendar = (workCenter, startDate = new Date()) => {
  const calendar = [];
  const today = new Date(startDate);
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < PLANNING_HORIZON_DAYS; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Check for breakdown on this date
    const hasBreakdown = workCenter.breakdowns?.some(b => b.date === dateStr) || false;
    
    // Calculate base capacity
    const baseCapacity = hasBreakdown ? 0 : 
      (workCenter.shift_hours_per_day * 
       workCenter.number_of_shifts * 
       workCenter.efficiency_percent);
    
    // Add overtime for this specific date
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

/**
 * Calculate required hours for a routing step
 */
export const calculateRequiredHours = (routingStep, orderQuantity) => {
  return (orderQuantity * routingStep.cycle_time_minutes / 60) + routingStep.setup_time_hours;
};

/**
 * Get today's date (normalized to midnight)
 */
export const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Calculate difference in days between two dates
 */
export const daysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = d1 - d2;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Reset all scheduling data before rebuild
 */
const resetSchedulingData = (workCenters, orders) => {
  // Ensure all work centers have parallel_units (default to 1)
  workCenters.forEach(wc => {
    wc.parallel_units = wc.parallel_units || 1;
    wc.calendar = wc.calendar || generateCalendar(wc);
    wc.calendar.forEach(day => {
      day.booked_hours = 0;
    });
  });
  
  // Reset order scheduling data
  orders.forEach(order => {
    order.planned_completion_date = null;
    order.delay_days = 0;
    order.delayed = false;
    order.unscheduled = false;
    
    order.routing.forEach(step => {
      step.completion_date = null;
      step.scheduled_days = [];
      step.required_hours = calculateRequiredHours(step, order.quantity);
      step.total_units_completed = 0;
      step.units_in_progress = 0;
    });
  });
};

/**
 * Calculate hours required to process a given number of units
 * Includes setup time (charged once) plus cycle time per unit
 */
const calculateHoursForUnits = (routingStep, numUnits, isFirstBatch) => {
  const setupTime = isFirstBatch ? routingStep.setup_time_hours : 0;
  const cycleTime = (numUnits * routingStep.cycle_time_minutes) / 60;
  return setupTime + cycleTime;
};

/**
 * Get WIP available for a routing step on a given day
 * For first step: all remaining units
 * For subsequent steps: units completed from previous step on previous day (end-of-day transfer)
 */
const getAvailableWIP = (order, routingStep, currentDateStr, wipTransfers) => {
  const stepIndex = order.routing.findIndex(s => s.sequence_number === routingStep.sequence_number);
  
  if (stepIndex === 0) {
    // First step: WIP = total quantity - already completed
    return order.quantity - routingStep.total_units_completed;
  } else {
    // Subsequent steps: WIP from previous step's completions on previous day
    const previousStep = order.routing[stepIndex - 1];
    const transferKey = `${order.id}_step${routingStep.sequence_number}_${currentDateStr}`;
    return wipTransfers[transferKey] || 0;
  }
};

/**
 * Flow-based scheduling for routing steps with parallel units support
 * Processes orders day-by-day, allowing WIP to flow between stages
 */
const scheduleFlowBased = (workCenters, orders, lastDateStr) => {
  const today = getToday();
  const wipTransfers = {}; // Track WIP transfers between stages
  
  // Create calendar date array
  const calendarDates = [];
  for (let i = 0; i < PLANNING_HORIZON_DAYS; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    calendarDates.push(date.toISOString().split('T')[0]);
  }
  
  // Process each day in planning horizon
  for (let dayIndex = 0; dayIndex < calendarDates.length; dayIndex++) {
    const currentDateStr = calendarDates[dayIndex];
    const nextDateStr = calendarDates[dayIndex + 1] || null;
    
    // Process each order (in priority order)
    for (const order of orders) {
      if (order.unscheduled) continue;
      
      // Process each routing step in sequence
      for (const routingStep of order.routing) {
        // Skip if this step is already complete
        if (routingStep.total_units_completed >= order.quantity) continue;
        
        const workCenter = workCenters.find(wc => wc.id === routingStep.work_center_id);
        if (!workCenter) continue;
        
        const calendarDay = workCenter.calendar.find(d => d.date === currentDateStr);
        if (!calendarDay || calendarDay.breakdown) continue;
        
        // Get available WIP for this step on this day
        const wipAvailable = getAvailableWIP(order, routingStep, currentDateStr, wipTransfers);
        if (wipAvailable <= 0) continue;
        
        // Calculate capacity constraints
        const parallelUnits = workCenter.parallel_units || 1;
        const dailyCapacityHours = calendarDay.available_hours - calendarDay.booked_hours;
        if (dailyCapacityHours <= 0) continue;
        
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
        
        // DEBUG: Log for 15000 order, first routing step, first 5 days
        if (order.quantity === 15000 && routingStep.sequence_number === 1 && dayIndex < 5) {
          console.log(`[DEBUG 15000 ORDER] Day ${dayIndex + 1} (${currentDateStr}):`);
          console.log(`  wipAvailable: ${wipAvailable}`);
          console.log(`  unitsToProcess: ${unitsToProcess}`);
        }
        
        // Calculate actual hours required (setup once + cycle time per unit)
        const hoursRequired = setupTime + (unitsToProcess * routingStep.cycle_time_minutes / 60);
        
        if (unitsToProcess > 0) {
          // Allocate capacity
          calendarDay.booked_hours += hoursRequired;
          
          // Track scheduled work
          const existingDay = routingStep.scheduled_days.find(d => d.date === currentDateStr);
          if (existingDay) {
            existingDay.hours += hoursRequired;
            existingDay.units_completed += unitsToProcess;
          } else {
            routingStep.scheduled_days.push({
              date: currentDateStr,
              hours: hoursRequired,
              units_completed: unitsToProcess
            });
          }
          
          // Update completion tracking
          routingStep.total_units_completed += unitsToProcess;
          
          // DEBUG: Log total_units_completed for 15000 order, first routing step, first 5 days
          if (order.quantity === 15000 && routingStep.sequence_number === 1 && dayIndex < 5) {
            console.log(`  total_units_completed (after): ${routingStep.total_units_completed}`);
          }
          
          // Mark step completion date when all units done
          if (routingStep.total_units_completed >= order.quantity) {
            routingStep.completion_date = currentDateStr;
          }
          
          // Schedule WIP transfer to next step (available next day)
          if (nextDateStr && routingStep.sequence_number < order.routing.length) {
            const nextStepSequence = routingStep.sequence_number + 1;
            const transferKey = `${order.id}_step${nextStepSequence}_${nextDateStr}`;
            wipTransfers[transferKey] = (wipTransfers[transferKey] || 0) + unitsToProcess;
          }
        }
      }
    }
  }
  
  // Mark orders as unscheduled if any routing step didn't complete
  for (const order of orders) {
    for (const routingStep of order.routing) {
      if (routingStep.total_units_completed < order.quantity) {
        order.unscheduled = true;
        break;
      }
    }
  }
};

/**
 * Main deterministic rebuild engine with flow-based scheduling
 */
export const rebuildSchedule = (workCenters, orders) => {
  if (!workCenters || !orders) return { workCenters: [], orders: [] };
  
  const today = getToday();
  const lastCalendarDate = new Date(today);
  lastCalendarDate.setDate(lastCalendarDate.getDate() + PLANNING_HORIZON_DAYS - 1);
  const lastDateStr = lastCalendarDate.toISOString().split('T')[0];
  
  // Step 1: Reset all scheduling data
  resetSchedulingData(workCenters, orders);
  
  // Step 2: Sort orders by priority (DESC) then creation_timestamp (ASC)
  const sortedOrders = [...orders].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority; // Higher priority first (3, 2, 1)
    }
    return new Date(a.creation_timestamp) - new Date(b.creation_timestamp);
  });
  
  // Step 3: Ensure routing is sorted by sequence
  sortedOrders.forEach(order => {
    order.routing = [...order.routing].sort((a, b) => a.sequence_number - b.sequence_number);
  });
  
  // Step 4: Flow-based scheduling
  scheduleFlowBased(workCenters, sortedOrders, lastDateStr);
  
  // DEBUG: Print values for 15000 order after scheduleFlowBased() completes
  sortedOrders.forEach(order => {
    if (order.quantity === 15000) {
      console.log('\n[BEFORE Step 5] 15000 Order:');
      console.log(`  order.unscheduled: ${order.unscheduled}`);
      order.routing.forEach(step => {
        console.log(`  Step ${step.sequence_number}:`);
        console.log(`    total_units_completed: ${step.total_units_completed}`);
        console.log(`    completion_date: ${step.completion_date}`);
      });
    }
  });
  
  // Step 5: Calculate completion dates and delays
  sortedOrders.forEach(order => {
    // DEBUG: Print order.unscheduled inside Step 5 loop for 15000 order
    if (order.quantity === 15000) {
      console.log('\n[INSIDE Step 5 Loop] 15000 Order:');
      console.log(`  order.unscheduled (before check): ${order.unscheduled}`);
    }
    
    if (!order.unscheduled) {
      // Find the routing step with the highest sequence_number that completed all units
      let completedStep = null;
      for (const step of order.routing) {
        if (step.total_units_completed >= order.quantity && step.completion_date !== null) {
          if (!completedStep || step.sequence_number > completedStep.sequence_number) {
            completedStep = step;
          }
        }
      }
      
      order.planned_completion_date = completedStep ? completedStep.completion_date : null;
      
      if (order.planned_completion_date) {
        const dueDate = new Date(order.due_date);
        const completionDate = new Date(order.planned_completion_date);
        
        if (completionDate > dueDate) {
          order.delayed = true;
          order.delay_days = daysDifference(completionDate, dueDate);
        } else {
          order.delayed = false;
          order.delay_days = 0;
        }
      }
    } else {
      order.planned_completion_date = null;
      order.delayed = true; // Unscheduled orders are considered delayed
    }
  });
  
  return { workCenters, orders: sortedOrders };
};

/**
 * Calculate delivery risk for an order
 */
export const calculateDeliveryRisk = (order) => {
  const today = getToday();
  const dueDate = new Date(order.due_date);
  const rawDaysUntilDue = daysDifference(dueDate, today);
  
  if (rawDaysUntilDue <= 0) {
    return 100;
  }
  
  if (order.delayed) {
    const daysUntilDue = Math.max(1, rawDaysUntilDue);
    return Math.min(100, (order.delay_days / daysUntilDue) * 100);
  }
  
  return 0;
};

/**
 * Calculate stability score
 */
export const calculateStabilityScore = (orders) => {
  const totalDelayDays = orders.reduce((sum, order) => sum + (order.delay_days || 0), 0);
  const score = 100 - Math.min(100, totalDelayDays * 5);
  return Math.max(0, Math.min(100, score));
};

/**
 * Identify bottleneck machine (7-day window from today)
 */
export const identifyBottleneck = (workCenters) => {
  const today = getToday();
  let bottleneck = null;
  let maxUtilization = 0;
  let maxBookedHours = 0;
  
  workCenters.forEach(wc => {
    let totalUtilization = 0;
    let validDays = 0;
    let totalBookedHours = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const calendarDay = wc.calendar?.find(d => d.date === dateStr);
      if (!calendarDay) continue;
      
      if (calendarDay.breakdown) continue;
      if (calendarDay.available_hours <= 0) continue;
      
      const dailyUtilization = (calendarDay.booked_hours / calendarDay.available_hours) * 100;
      totalUtilization += dailyUtilization;
      totalBookedHours += calendarDay.booked_hours;
      validDays++;
    }
    
    const avgUtilization = validDays > 0 ? totalUtilization / validDays : 0;
    
    if (avgUtilization > maxUtilization || 
        (avgUtilization === maxUtilization && totalBookedHours > maxBookedHours)) {
      maxUtilization = avgUtilization;
      maxBookedHours = totalBookedHours;
      bottleneck = {
        work_center_id: wc.id,
        work_center_name: wc.name,
        utilization_percent: Math.round(avgUtilization * 10) / 10
      };
    }
  });
  
  return bottleneck;
};

/**
 * Get capacity utilization color
 */
export const getUtilizationColor = (utilizationPercent, isBreakdown) => {
  if (isBreakdown) return 'grey';
  if (utilizationPercent > 95) return 'red';
  if (utilizationPercent >= 80) return 'amber';
  return 'green';
};

/**
 * Get orders at risk (delayed or high risk)
 */
export const getOrdersAtRisk = (orders) => {
  return orders
    .filter(order => order.delayed || calculateDeliveryRisk(order) > 50)
    .map(order => ({
      ...order,
      risk: calculateDeliveryRisk(order)
    }))
    .sort((a, b) => b.risk - a.risk);
};
