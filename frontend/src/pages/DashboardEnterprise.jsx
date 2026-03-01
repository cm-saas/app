import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { 
  identifyBottleneck, 
  calculateStabilityScore,
  getOrdersAtRisk,
  getToday
} from '../services/schedulingEngine';
import { Plus } from 'lucide-react';

export default function EnterpriseDashboard() {
  const { workCenters, orders, loading, addOrder } = useData();
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);

  if (loading) {
    return <div className="loading-overlay"><div className="spinner"></div></div>;
  }

  const today = getToday();
  const planningHorizon = 60;
  const totalOrders = orders.length;
  const totalMachines = workCenters.length;
  
  const avgUtilization = workCenters.reduce((sum, wc) => {
    const first7Days = wc.calendar?.slice(0, 7) || [];
    const avgUtil = first7Days.reduce((s, d) => {
      return s + (d.available_hours > 0 ? (d.booked_hours / d.available_hours) * 100 : 0);
    }, 0) / (first7Days.length || 1);
    return sum + avgUtil;
  }, 0) / (workCenters.length || 1);

  const bottleneck = identifyBottleneck(workCenters);
  const stabilityScore = calculateStabilityScore(orders);
  const ordersAtRisk = getOrdersAtRisk(orders);
  const delayedCount = orders.filter(o => o.delayed).length;

  const heatmapDays = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    heatmapDays.push({ date: date.toISOString().split('T')[0], dayNum: date.getDate() });
  }

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <ContextBar 
        today={today.toISOString().split('T')[0]}
        horizon={planningHorizon}
        totalOrders={totalOrders}
        totalMachines={totalMachines}
        avgUtilization={avgUtilization}
      />
      
      <KPIRow 
        stabilityScore={stabilityScore}
        bottleneck={bottleneck}
        delayedCount={delayedCount}
        atRiskCount={ordersAtRisk.length}
      />

      <div className="card mb-32">
        <div className="card-header">
          <h3 className="card-title">14-Day Capacity Heatmap</h3>
        </div>
        <CapacityHeatmap workCenters={workCenters} days={heatmapDays} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <RecentOrders orders={orders.slice(0, 5)} />
        <RiskAlerts orders={ordersAtRisk.slice(0, 5)} />
      </div>

      {showAddOrderModal && (
        <AddOrderModal 
          workCenters={workCenters}
          onClose={() => setShowAddOrderModal(false)}
          onSubmit={async (order) => {
            await addOrder(order);
            setShowAddOrderModal(false);
          }}
        />
      )}

      <button 
        className="btn btn-primary"
        data-testid="add-order-fab"
        onClick={() => setShowAddOrderModal(true)}
        style={{ position: 'fixed', bottom: '32px', right: '32px', borderRadius: '50%', width: '56px', height: '56px', padding: '0', boxShadow: '0 8px 16px rgba(0,255,198,0.3)' }}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

function ContextBar({ today, horizon, totalOrders, totalMachines, avgUtilization }) {
  return (
    <div className="context-bar">
      <div className="context-item">
        <div className="context-label">Today's Date</div>
        <div className="context-value">{today}</div>
      </div>
      <div className="context-item">
        <div className="context-label">Planning Horizon</div>
        <div className="context-value">{horizon} Days</div>
      </div>
      <div className="context-item">
        <div className="context-label">Total Orders</div>
        <div className="context-value">{totalOrders}</div>
      </div>
      <div className="context-item">
        <div className="context-label">Total Machines</div>
        <div className="context-value">{totalMachines}</div>
      </div>
      <div className="context-item">
        <div className="context-label">Avg Utilization</div>
        <div className="context-value">{avgUtilization.toFixed(1)}%</div>
      </div>
    </div>
  );
}

function KPIRow({ stabilityScore, bottleneck, delayedCount, atRiskCount }) {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);
  }, []);

  const scoreColor = stabilityScore >= 80 ? '#10b981' : stabilityScore >= 50 ? '#f59e0b' : '#ef4444';
  const bottleneckColor = bottleneck?.utilization_percent > 95 ? '#ef4444' : 
                         bottleneck?.utilization_percent > 85 ? '#f59e0b' : '#10b981';

  return (
    <div className="kpi-grid mb-32">
      <div className="kpi-card">
        <div className="kpi-label">Stability Score</div>
        <div className={`kpi-value ${animated ? 'animate' : ''}`} style={{ color: scoreColor }}>
          {Math.round(stabilityScore)}
          <span style={{ fontSize: '20px', marginLeft: '4px' }}>/100</span>
        </div>
        <div className="kpi-subtitle">System Health</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Bottleneck Machine</div>
        <div className="kpi-value" style={{ fontSize: '20px', color: 'var(--text-primary)' }}>
          {bottleneck ? bottleneck.work_center_name : 'None'}
          <span className="kpi-indicator" style={{ background: bottleneckColor }}></span>
        </div>
        <div className="kpi-subtitle">
          {bottleneck ? `${bottleneck.utilization_percent.toFixed(1)}% utilized` : 'All clear'}
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Delayed Orders</div>
        <div className={`kpi-value ${animated ? 'animate' : ''}`} style={{ color: delayedCount > 0 ? '#ef4444' : '#10b981' }}>
          {delayedCount}
        </div>
        <div className="kpi-subtitle">Behind schedule</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Orders At Risk</div>
        <div className={`kpi-value ${animated ? 'animate' : ''}`} style={{ color: atRiskCount > 0 ? '#f59e0b' : '#10b981' }}>
          {atRiskCount}
        </div>
        <div className="kpi-subtitle">Requires attention</div>
      </div>
    </div>
  );
}

function CapacityHeatmap({ workCenters, days }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '700px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '150px' }}></div>
          {days.map(({ dayNum }) => (
            <div key={dayNum} style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {dayNum}
            </div>
          ))}
        </div>
        {workCenters.map(wc => (
          <div key={wc.id} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '150px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{wc.name}</div>
            {days.map(({ date }) => {
              const day = wc.calendar?.find(d => d.date === date);
              const util = day?.available_hours > 0 ? (day.booked_hours / day.available_hours) * 100 : 0;
              const color = day?.breakdown ? '#6b7280' : util > 95 ? '#ef4444' : util >= 80 ? '#f59e0b' : '#10b981';
              return (
                <div 
                  key={date}
                  style={{ 
                    flex: 1, 
                    height: '40px', 
                    background: color, 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(0,0,0,0.7)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  title={`${date}\n${wc.name}\n${util.toFixed(0)}% utilized`}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {util > 0 ? Math.round(util) : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentOrders({ orders }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Recent Orders</h3>
      </div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No orders yet</div>
          <div className="empty-description">Create your first order to start scheduling</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Quantity</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.customer}</td>
                  <td>{order.quantity}</td>
                  <td>
                    <span className={`badge ${order.priority === 3 ? 'badge-danger' : order.priority === 2 ? 'badge-warning' : 'badge-info'}`}>
                      {order.priority === 3 ? 'High' : order.priority === 2 ? 'Normal' : 'Low'}
                    </span>
                  </td>
                  <td>{new Date(order.due_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${order.status === 'COMPLETED' ? 'badge-success' : 'badge-info'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RiskAlerts({ orders }) {
  return (
    <div className="card card-elevated" style={{ background: 'var(--bg-elevated)' }}>
      <div className="card-header">
        <h3 className="card-title" style={{ color: '#f59e0b' }}>⚠️ Risk Alerts</h3>
      </div>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.6 }}>✓</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>All systems operational</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map(order => (
            <div key={order.id} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{order.customer}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Delay: {order.delay_days} days • Risk: {Math.round(order.risk)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddOrderModal({ workCenters, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    customer: '',
    quantity: 100,
    priority: 2,
    due_date: '',
    routing: [{ 
      sequence_number: 1, 
      work_center_id: workCenters[0]?.id || '', 
      cycle_time_minutes: 5, 
      setup_time_hours: 1 
    }]
  });

  const addRoutingStep = () => {
    setFormData({
      ...formData,
      routing: [
        ...formData.routing,
        {
          sequence_number: formData.routing.length + 1,
          work_center_id: workCenters[0]?.id || '',
          cycle_time_minutes: 5,
          setup_time_hours: 1
        }
      ]
    });
  };

  const removeRoutingStep = (index) => {
    const newRouting = formData.routing.filter((_, i) => i !== index);
    // Renumber sequences
    newRouting.forEach((step, i) => step.sequence_number = i + 1);
    setFormData({ ...formData, routing: newRouting });
  };

  const updateRoutingStep = (index, field, value) => {
    const newRouting = [...formData.routing];
    if (field.includes('time')) {
      // Always parse to number, allow empty string during editing
      const numValue = value === '' ? '' : parseFloat(value);
      newRouting[index][field] = numValue;
    } else {
      newRouting[index][field] = value;
    }
    setFormData({ ...formData, routing: newRouting });
    
    // Debug log to verify correct value
    if (field === 'cycle_time_minutes') {
      console.log(`[Form] cycle_time_minutes updated:`, {
        rawInput: value,
        parsed: newRouting[index][field],
        type: typeof newRouting[index][field]
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <h2 style={{ marginBottom: '24px' }}>Create New Order</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Customer</label>
            <input
              type="text"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              required
              style={{ width: '100%', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Quantity</label>
              <input 
                type="number" 
                value={formData.quantity} 
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} 
                required 
                min="1" 
                style={{ width: '100%', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Priority</label>
              <select 
                value={formData.priority} 
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })} 
                style={{ width: '100%', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }}
              >
                <option value={3}>High</option>
                <option value={2}>Normal</option>
                <option value={1}>Low</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Due Date</label>
              <input 
                type="date" 
                value={formData.due_date} 
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} 
                required 
                style={{ width: '100%', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }} 
              />
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Routing Steps</h3>
              <button 
                type="button" 
                onClick={addRoutingStep} 
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                + Add Step
              </button>
            </div>

            {formData.routing.map((step, index) => (
              <div key={index} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)' }}>Step {step.sequence_number}</span>
                  {formData.routing.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeRoutingStep(index)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Work Center</label>
                    <select
                      value={step.work_center_id}
                      onChange={(e) => updateRoutingStep(index, 'work_center_id', e.target.value)}
                      style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                    >
                      {workCenters.map(wc => (
                        <option key={wc.id} value={wc.id}>{wc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Cycle Time (min/unit)</label>
                    <input
                      type="number"
                      value={step.cycle_time_minutes}
                      onChange={(e) => updateRoutingStep(index, 'cycle_time_minutes', e.target.value)}
                      step="any"
                      min="0.000001"
                      style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Setup Time (hrs)</label>
                    <input
                      type="number"
                      value={step.setup_time_hours}
                      onChange={(e) => updateRoutingStep(index, 'setup_time_hours', e.target.value)}
                      step="any"
                      min="0"
                      style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Required: {((formData.quantity * parseFloat(step.cycle_time_minutes || 0)) / 60 + parseFloat(step.setup_time_hours || 0)).toFixed(2)} hours
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Order</button>
          </div>
        </form>
      </div>
    </div>
  );
}
