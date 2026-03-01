import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  rebuildSchedule, 
  generateCalendar 
} from '../services/schedulingEngine';
import { useToast } from '../components/ToastProvider';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const [workCenters, setWorkCenters] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  // Calculate automatic order status based on conditions
  const calculateOrderStatus = (order) => {
    const today = new Date().toISOString().split("T")[0];

    if (order.unscheduled) return "UNSCHEDULED";

    if (order.net_required_quantity === 0) return "COMPLETED";

    if (order.actual_units_completed >= order.original_quantity) return "COMPLETED";

    if (today < order.start_date) return "PLANNED";

    if (today >= order.start_date) return "IN_PROGRESS";

    return "PLANNED";
  };

  // Fetch data from API
  const fetchData = async () => {
    if (!isAuthenticated) {
      console.log('[DataContext] Not authenticated, skipping data fetch');
      setLoading(false);
      return;
    }

    console.log('[DataContext] Fetching work centers and orders...');
    try {
      const [wcsResponse, ordersResponse] = await Promise.all([
        axios.get(`${backendUrl}/api/data/work-centers`),
        axios.get(`${backendUrl}/api/data/orders`)
      ]);

      const wcs = wcsResponse.data || [];
      const ords = ordersResponse.data || [];

      console.log('[DataContext] Fetched:', wcs.length, 'work centers,', ords.length, 'orders');

      // Trigger local rebuild for scheduling
      await triggerRebuild(wcs, ords, false, true);
    } catch (error) {
      console.error('[DataContext] Failed to fetch data:', error.response?.status, error.message);
      
      // CRITICAL: Do NOT logout on data fetch errors
      // Only log the error, don't clear auth state
      if (error.response?.status === 401) {
        console.error('[DataContext] 401 Unauthorized - Token may be invalid');
        // Let AuthContext handle this, don't logout here
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger rebuild and update state + API
  const triggerRebuild = async (wcs, ords, showLoading = false, skipApiUpdate = false) => {
    if (showLoading) setRebuilding(true);
    
    // Small delay for UI feedback
    if (showLoading) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    // Generate calendars if missing
    const wcsWithCalendars = wcs.map(wc => ({
      ...wc,
      calendar: wc.calendar?.length > 0 ? wc.calendar : generateCalendar(wc)
    }));
    
    // Run scheduling engine
    const result = rebuildSchedule(wcsWithCalendars, ords);
    
    // Apply automatic status logic to all orders
    result.orders.forEach(order => {
      order.status = calculateOrderStatus(order);
    });
    
    setWorkCenters(result.workCenters);
    setOrders(result.orders);
    
    // Sync to API
    if (!skipApiUpdate && isAuthenticated) {
      try {
        await axios.post(`${backendUrl}/api/data/bulk-update`, {
          workCenters: result.workCenters,
          orders: result.orders
        });
      } catch (error) {
        console.error('Failed to sync data:', error);
      }
    }
    
    if (showLoading) setRebuilding(false);
    
    return result;
  };

  // Initialize on mount or auth change
  useEffect(() => {
    console.log('[DataContext] useEffect triggered - isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      fetchData();
    } else {
      console.log('[DataContext] Not authenticated, clearing data');
      setWorkCenters([]);
      setOrders([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Add order
  const addOrder = async (order) => {
    const newOrder = {
      ...order,
      id: `order_${Date.now()}`,
      creation_timestamp: new Date().toISOString(),
      status: 'PLANNED',
      planned_completion_date: null,
      actual_completion_date: null,
      dispatch_date: null,
      delayed: false,
      delay_days: 0,
      unscheduled: false
    };
    
    try {
      // Create in API
      await axios.post(`${backendUrl}/api/data/orders`, newOrder);
      
      // Trigger rebuild with new order
      const updatedOrders = [...orders, newOrder];
      await triggerRebuild(workCenters, updatedOrders, true);
      toast.success('Order created successfully');
      return newOrder;
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Failed to create order');
      throw error;
    }
  };

  // Edit order
  const editOrder = async (orderId, updates) => {
    try {
      const updatedOrders = orders.map(o => 
        o.id === orderId ? { ...o, ...updates } : o
      );
      
      // Update in API
      const updatedOrder = updatedOrders.find(o => o.id === orderId);
      await axios.put(`${backendUrl}/api/data/orders/${orderId}`, updatedOrder);
      
      // Trigger rebuild
      await triggerRebuild(workCenters, updatedOrders, true);
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
      throw error;
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    try {
      // Delete from API
      await axios.delete(`${backendUrl}/api/data/orders/${orderId}`);
      
      // Remove from state and rebuild
      const updatedOrders = orders.filter(o => o.id !== orderId);
      await triggerRebuild(workCenters, updatedOrders, true);
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('Failed to delete order');
      throw error;
    }
  };

  // Add work center
  const addWorkCenter = async (wc) => {
    try {
      const newWc = {
        ...wc,
        id: `wc_${Date.now()}`,
        calendar: generateCalendar(wc)
      };
      
      // Create in API
      await axios.post(`${backendUrl}/api/data/work-centers`, newWc);
      
      // Trigger rebuild
      const updatedWCs = [...workCenters, newWc];
      await triggerRebuild(updatedWCs, orders, true);
      toast.success('Work center created successfully');
      return newWc;
    } catch (error) {
      console.error('Failed to create work center:', error);
      toast.error('Failed to create work center');
      throw error;
    }
  };

  // Edit work center
  const editWorkCenter = async (wcId, updates) => {
    try {
      const updatedWCs = workCenters.map(wc => 
        wc.id === wcId ? { ...wc, ...updates, calendar: generateCalendar({ ...wc, ...updates }) } : wc
      );
      
      // Update in API
      const updatedWC = updatedWCs.find(wc => wc.id === wcId);
      await axios.put(`${backendUrl}/api/data/work-centers/${wcId}`, updatedWC);
      
      // Trigger rebuild
      await triggerRebuild(updatedWCs, orders, true);
      toast.success('Work center updated successfully');
    } catch (error) {
      console.error('Failed to update work center:', error);
      toast.error('Failed to update work center');
      throw error;
    }
  };

  // Delete work center
  const deleteWorkCenter = async (wcId) => {
    try {
      // Delete from API
      await axios.delete(`${backendUrl}/api/data/work-centers/${wcId}`);
      
      // Remove from state and rebuild
      const updatedWCs = workCenters.filter(wc => wc.id !== wcId);
      await triggerRebuild(updatedWCs, orders, true);
      toast.success('Work center deleted successfully');
    } catch (error) {
      console.error('Failed to delete work center:', error);
      toast.error('Failed to delete work center');
      throw error;
    }
  };

  // Update overtime
  const updateOvertime = async (wcId, date, hours) => {
    const updatedWCs = workCenters.map(wc => {
      if (wc.id !== wcId) return wc;
      
      const existingOTIndex = wc.overtime_rules?.findIndex(ot => ot.date === date);
      let newOvertimeRules = [...(wc.overtime_rules || [])];
      
      if (hours > 0) {
        if (existingOTIndex >= 0) {
          newOvertimeRules[existingOTIndex] = { date, overtime_hours: hours };
        } else {
          newOvertimeRules.push({ date, overtime_hours: hours });
        }
      } else {
        newOvertimeRules = newOvertimeRules.filter(ot => ot.date !== date);
      }
      
      const updated = { ...wc, overtime_rules: newOvertimeRules, calendar: generateCalendar({ ...wc, overtime_rules: newOvertimeRules }) };
      
      // Update in API
      axios.put(`${backendUrl}/api/data/work-centers/${wcId}`, updated).catch(console.error);
      
      return updated;
    });
    
    await triggerRebuild(updatedWCs, orders, true);
  };

  // Add breakdown
  const addBreakdown = async (wcId, date) => {
    const updatedWCs = workCenters.map(wc => {
      if (wc.id !== wcId) return wc;
      
      const updated = {
        ...wc,
        breakdowns: [...(wc.breakdowns || []), { date }],
        calendar: generateCalendar({ ...wc, breakdowns: [...(wc.breakdowns || []), { date }] })
      };
      
      // Update in API
      axios.put(`${backendUrl}/api/data/work-centers/${wcId}`, updated).catch(console.error);
      
      return updated;
    });
    
    await triggerRebuild(updatedWCs, orders, true);
  };

  // Remove breakdown
  const removeBreakdown = async (wcId, date) => {
    const updatedWCs = workCenters.map(wc => {
      if (wc.id !== wcId) return wc;
      
      const updated = {
        ...wc,
        breakdowns: (wc.breakdowns || []).filter(b => b.date !== date),
        calendar: generateCalendar({ ...wc, breakdowns: (wc.breakdowns || []).filter(b => b.date !== date) })
      };
      
      // Update in API
      axios.put(`${backendUrl}/api/data/work-centers/${wcId}`, updated).catch(console.error);
      
      return updated;
    });
    
    await triggerRebuild(updatedWCs, orders, true);
  };

  const value = {
    workCenters,
    orders,
    loading,
    rebuilding,
    addOrder,
    editOrder,
    deleteOrder,
    addWorkCenter,
    editWorkCenter,
    deleteWorkCenter,
    updateOvertime,
    addBreakdown,
    removeBreakdown,
    triggerRebuild
  };

  return (
    <DataContext.Provider value={value}>
      {rebuilding && <LoadingOverlay />}
      {children}
    </DataContext.Provider>
  );
};
