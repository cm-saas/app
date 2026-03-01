import React from 'react';
import { useData } from '../context/DataContext';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { getOrdersAtRisk } from '../services/schedulingEngine';

export default function Risks() {
  const { orders } = useData();
  
  const ordersAtRisk = getOrdersAtRisk(orders);
  const criticalOrders = ordersAtRisk.filter(o => o.risk > 75);
  const highRiskOrders = ordersAtRisk.filter(o => o.risk > 50 && o.risk <= 75);
  const mediumRiskOrders = ordersAtRisk.filter(o => o.risk > 25 && o.risk <= 50);

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      {/* Risk Summary Cards */}
      <div className="kpi-grid mb-32" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-label">Critical Risk</div>
          <div className="kpi-value" style={{ color: '#ef4444' }}>
            {criticalOrders.length}
          </div>
          <div className="kpi-subtitle">Orders &gt; 75% risk</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">High Risk</div>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>
            {highRiskOrders.length}
          </div>
          <div className="kpi-subtitle">Orders 50-75% risk</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Medium Risk</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>
            {mediumRiskOrders.length}
          </div>
          <div className="kpi-subtitle">Orders 25-50% risk</div>
        </div>
      </div>

      {/* All At-Risk Orders */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} />
            All At-Risk Orders ({ordersAtRisk.length})
          </h3>
        </div>
        
        {ordersAtRisk.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <TrendingUp size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>All Clear!</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              No orders are currently at risk. System is operating within safe parameters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Risk Level</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Quantity</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Planned Completion</th>
                  <th>Delay</th>
                  <th>Risk %</th>
                </tr>
              </thead>
              <tbody>
                {ordersAtRisk.map(order => {
                  const riskLevel = order.risk > 75 ? 'CRITICAL' : 
                                  order.risk > 50 ? 'HIGH' : 'MEDIUM';
                  const riskColor = order.risk > 75 ? '#ef4444' : 
                                  order.risk > 50 ? '#f59e0b' : '#10b981';
                  
                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="badge" style={{ 
                          background: riskColor,
                          color: '#000',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {riskLevel}
                        </span>
                      </td>
                      <td className="mono-text">{order.id.substring(0, 12)}...</td>
                      <td>{order.customer}</td>
                      <td>{order.quantity}</td>
                      <td>
                        <span className={`badge ${order.priority === 3 ? 'badge-danger' : order.priority === 2 ? 'badge-warning' : 'badge-info'}`}>
                          {order.priority === 3 ? 'High' : order.priority === 2 ? 'Normal' : 'Low'}
                        </span>
                      </td>
                      <td>{new Date(order.due_date).toLocaleDateString()}</td>
                      <td>
                        {order.planned_completion_date ? 
                          new Date(order.planned_completion_date).toLocaleDateString() : 
                          <span style={{ color: '#ef4444' }}>Unscheduled</span>
                        }
                      </td>
                      <td style={{ color: order.delay_days > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {order.delay_days > 0 ? `+${order.delay_days} days` : '-'}
                      </td>
                      <td>
                        <span style={{ 
                          color: riskColor,
                          fontWeight: 700,
                          fontSize: '16px'
                        }}>
                          {Math.round(order.risk)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
