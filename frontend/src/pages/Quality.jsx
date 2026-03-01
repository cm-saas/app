import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

export default function Quality() {
  const { orders, productionLogs } = useData();
  
  // Date range state
  const [dateRange, setDateRange] = useState('14'); // '14', '30', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Get date range for filtering
  const getDateRange = () => {
    const today = new Date();
    let startDate;
    
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    } else if (dateRange === '30') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 14);
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Filter production logs by date range
  const filteredLogs = useMemo(() => {
    return productionLogs.filter(log => log.date >= startDate && log.date <= endDate);
  }, [productionLogs, startDate, endDate]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalProduced = filteredLogs.reduce((sum, log) => sum + (log.quantity_produced || 0), 0);
    const totalRejected = filteredLogs.reduce((sum, log) => sum + (log.quantity_rejected || 0), 0);
    const rejectionPercent = totalProduced > 0 ? (totalRejected / totalProduced) * 100 : 0;

    // Calculate by part
    const byPart = {};
    filteredLogs.forEach(log => {
      if (!byPart[log.part_number]) {
        byPart[log.part_number] = { produced: 0, rejected: 0 };
      }
      byPart[log.part_number].produced += log.quantity_produced || 0;
      byPart[log.part_number].rejected += log.quantity_rejected || 0;
    });

    const partMetrics = Object.entries(byPart).map(([part, data]) => ({
      part,
      produced: data.produced,
      rejected: data.rejected,
      rejectionPercent: data.produced > 0 ? (data.rejected / data.produced) * 100 : 0
    }));

    const bestPart = partMetrics.length > 0 
      ? partMetrics.reduce((best, current) => current.rejectionPercent < best.rejectionPercent ? current : best)
      : null;

    const worstPart = partMetrics.length > 0
      ? partMetrics.reduce((worst, current) => current.rejectionPercent > worst.rejectionPercent ? current : worst)
      : null;

    return {
      totalProduced,
      totalRejected,
      rejectionPercent,
      bestPart,
      worstPart
    };
  }, [filteredLogs]);

  // Daily rejection trend
  const dailyTrend = useMemo(() => {
    const dailyData = {};
    
    filteredLogs.forEach(log => {
      if (!dailyData[log.date]) {
        dailyData[log.date] = { produced: 0, rejected: 0 };
      }
      dailyData[log.date].produced += log.quantity_produced || 0;
      dailyData[log.date].rejected += log.quantity_rejected || 0;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        rejectionPercent: data.produced > 0 ? (data.rejected / data.produced) * 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredLogs]);

  // Rejection by part
  const rejectionByPart = useMemo(() => {
    const byPart = {};
    
    filteredLogs.forEach(log => {
      if (!byPart[log.part_number]) {
        byPart[log.part_number] = { produced: 0, rejected: 0 };
      }
      byPart[log.part_number].produced += log.quantity_produced || 0;
      byPart[log.part_number].rejected += log.quantity_rejected || 0;
    });

    return Object.entries(byPart)
      .map(([part, data]) => ({
        part,
        produced: data.produced,
        rejected: data.rejected,
        rejectionPercent: data.produced > 0 ? (data.rejected / data.produced) * 100 : 0
      }))
      .sort((a, b) => b.rejectionPercent - a.rejectionPercent);
  }, [filteredLogs]);

  // Rejection by order
  const rejectionByOrder = useMemo(() => {
    const byOrder = {};
    
    filteredLogs.forEach(log => {
      if (!byOrder[log.order_id]) {
        const order = orders.find(o => o.id === log.order_id);
        byOrder[log.order_id] = {
          orderId: log.order_id,
          customer: order?.customer || 'Unknown',
          partNumber: log.part_number,
          produced: 0,
          rejected: 0
        };
      }
      byOrder[log.order_id].produced += log.quantity_produced || 0;
      byOrder[log.order_id].rejected += log.quantity_rejected || 0;
    });

    return Object.values(byOrder)
      .map(order => ({
        ...order,
        rejectionPercent: order.produced > 0 ? (order.rejected / order.produced) * 100 : 0
      }))
      .sort((a, b) => b.rejectionPercent - a.rejectionPercent);
  }, [filteredLogs, orders]);

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Quality Analytics
        </h2>

        {/* Date Range Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Produced</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {kpis.totalProduced.toFixed(0)}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Rejected</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#FF5252' }}>
            {kpis.totalRejected.toFixed(0)}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Rejection %</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: kpis.rejectionPercent > 5 ? '#FF5252' : '#00C853' }}>
            {kpis.rejectionPercent.toFixed(2)}%
          </div>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Award size={14} />
            Best Part
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#00C853' }}>
            {kpis.bestPart ? `${kpis.bestPart.part} (${kpis.bestPart.rejectionPercent.toFixed(2)}%)` : 'N/A'}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} />
            Worst Part
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#FF5252' }}>
            {kpis.worstPart ? `${kpis.worstPart.part} (${kpis.worstPart.rejectionPercent.toFixed(2)}%)` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Rejection Trend Chart */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Rejection % Trend
        </h3>
        
        {dailyTrend.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
            No production data available for selected period
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', minWidth: `${dailyTrend.length * 40}px`, height: '200px' }}>
              {dailyTrend.map((day, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: `${Math.min(day.rejectionPercent * 2, 200)}px`,
                    background: day.rejectionPercent > 5 ? '#FF5252' : '#00C853',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s'
                  }} title={`${day.rejectionPercent.toFixed(2)}%`}></div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', transform: 'rotate(-45deg)', transformOrigin: 'top left' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rejection by Part Table */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Rejection % by Part
        </h3>
        
        {rejectionByPart.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            No data available
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Produced</th>
                  <th>Rejected</th>
                  <th>Rejection %</th>
                </tr>
              </thead>
              <tbody>
                {rejectionByPart.map((item, index) => (
                  <tr key={index}>
                    <td className="mono-text" style={{ fontWeight: '600' }}>{item.part}</td>
                    <td>{item.produced.toFixed(0)}</td>
                    <td style={{ color: '#FF5252', fontWeight: '600' }}>{item.rejected.toFixed(0)}</td>
                    <td>
                      <span style={{
                        color: item.rejectionPercent > 5 ? '#FF5252' : '#00C853',
                        fontWeight: '600'
                      }}>
                        {item.rejectionPercent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection by Order Table */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Rejection % by Order
        </h3>
        
        {rejectionByOrder.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            No data available
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Part Number</th>
                  <th>Produced</th>
                  <th>Rejected</th>
                  <th>Rejection %</th>
                </tr>
              </thead>
              <tbody>
                {rejectionByOrder.map((item, index) => (
                  <tr key={index}>
                    <td className="mono-text">{item.orderId.substring(0, 12)}...</td>
                    <td>{item.customer}</td>
                    <td className="mono-text">{item.partNumber}</td>
                    <td>{item.produced.toFixed(0)}</td>
                    <td style={{ color: '#FF5252', fontWeight: '600' }}>{item.rejected.toFixed(0)}</td>
                    <td>
                      <span style={{
                        color: item.rejectionPercent > 5 ? '#FF5252' : '#00C853',
                        fontWeight: '600'
                      }}>
                        {item.rejectionPercent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
