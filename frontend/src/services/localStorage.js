/**
 * FluxNex LocalStorage Service
 * Handles persistence of work centers and orders
 */

const STORAGE_KEYS = {
  WORK_CENTERS: 'fluxnex_work_centers',
  ORDERS: 'fluxnex_orders',
  USER: 'fluxnex_user'
};

/**
 * Save work centers to localStorage
 */
export const saveWorkCenters = (workCenters) => {
  try {
    localStorage.setItem(STORAGE_KEYS.WORK_CENTERS, JSON.stringify(workCenters));
    return true;
  } catch (error) {
    console.error('Error saving work centers:', error);
    return false;
  }
};

/**
 * Load work centers from localStorage
 */
export const loadWorkCenters = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WORK_CENTERS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading work centers:', error);
    return null;
  }
};

/**
 * Save orders to localStorage
 */
export const saveOrders = (orders) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error('Error saving orders:', error);
    return false;
  }
};

/**
 * Load orders from localStorage
 */
export const loadOrders = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading orders:', error);
    return null;
  }
};

/**
 * Save user auth data
 */
export const saveUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
};

/**
 * Load user auth data
 */
export const loadUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading user:', error);
    return null;
  }
};

/**
 * Clear user auth data (logout)
 */
export const clearUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    return true;
  } catch (error) {
    console.error('Error clearing user:', error);
    return false;
  }
};

/**
 * Clear all FluxNex data
 */
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
};

/**
 * Initialize with sample data if empty
 */
export const initializeSampleData = () => {
  const existingWCs = loadWorkCenters();
  const existingOrders = loadOrders();
  
  if (!existingWCs || existingWCs.length === 0) {
    const sampleWorkCenters = [
      {
        id: 'wc_cnc_01',
        name: 'CNC Mill 01',
        shift_hours_per_day: 8,
        number_of_shifts: 2,
        efficiency_percent: 0.95,
        cost_per_hour: 150,
        parallel_units: 2,
        overtime_rules: [],
        breakdowns: [],
        calendar: []
      },
      {
        id: 'wc_ht_01',
        name: 'Heat Treatment 01',
        shift_hours_per_day: 8,
        number_of_shifts: 3,
        efficiency_percent: 0.90,
        cost_per_hour: 120,
        parallel_units: 1,
        overtime_rules: [],
        breakdowns: [],
        calendar: []
      },
      {
        id: 'wc_grind_01',
        name: 'Grinding 01',
        shift_hours_per_day: 8,
        number_of_shifts: 2,
        efficiency_percent: 0.92,
        cost_per_hour: 130,
        parallel_units: 1,
        overtime_rules: [],
        breakdowns: [],
        calendar: []
      }
    ];
    
    saveWorkCenters(sampleWorkCenters);
  }
  
  if (!existingOrders || existingOrders.length === 0) {
    // Start with empty orders
    saveOrders([]);
  }
};
