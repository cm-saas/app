import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ClipboardList, Plus, Edit2, Trash2, Calendar } from 'lucide-react';

export default function Production() {
  const { orders, productionLogs, addProductionLog, updateProductionLog, deleteProductionLog } = useData();
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [formData, setFormData] = useState({
    date: getYesterday(),
    quantity_produced: 0,
    quantity_rejected: 0
  });
  const [editingLog, setEditingLog] = useState(null);

  // Get yesterday's date as default
  function getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  // Get today for validation
  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  // Get 14 days ago
  function get14DaysAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return date.toISOString().split('T')[0];
  }

  // Filter active orders (remaining_quantity > 0 and not unscheduled)
  const activeOrders = useMemo(() => {
    return orders.filter(order => {
      const remaining = order.remaining_quantity !== undefined ? order.remaining_quantity : 0;
      return remaining > 0 && !order.unscheduled;
    });
  }, [orders]);

  // Get 14-day production logs (all orders, regardless of status)
  const last14DaysLogs = useMemo(() => {
    const cutoffDate = get14DaysAgo();
    return productionLogs.filter(log => log.date >= cutoffDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [productionLogs]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOrderId) {
      alert('Please select an order');
      return;
    }

    if (formData.date > getToday()) {
      alert('Cannot log production for future dates');
      return;
    }

    if (formData.quantity_produced <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (formData.quantity_rejected < 0) {
      alert('Quantity rejected cannot be negative');
      return;
    }

    if (formData.quantity_rejected > formData.quantity_produced) {
      alert('Quantity rejected cannot exceed quantity produced');
      return;
    }

    const remaining = selectedOrder.remaining_quantity || 0;
    if (formData.quantity_produced > remaining) {
      alert(`Cannot exceed remaining quantity: ${remaining}`);
      return;
    }

    await addProductionLog({
      order_id: selectedOrderId,
      part_number: selectedOrder.part_number,
      date: formData.date,
      quantity_produced: parseFloat(formData.quantity_produced),
      quantity_rejected: parseFloat(formData.quantity_rejected) || 0
    });

    // Reset form
    setFormData({
      date: getYesterday(),
      quantity_produced: 0,
      quantity_rejected: 0
    });
  };

  const handleEdit = (log) => {
    setEditingLog(log);
  };

  const handleUpdate = async (logId, updates) => {
    await updateProductionLog(logId, updates);
    setEditingLog(null);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this production log?')) {
      await deleteProductionLog(logId);
    }
  };

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Production Logging
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
        {/* LEFT PANEL: Active Orders List */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          height: 'fit-content'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Active Orders
          </h3>

          {activeOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              No active orders available for production logging.
            </p>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Select Order</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="form-input-modal"
                  style={{ width: '100%' }}
                >
                  <option value="">Choose an order...</option>
                  {activeOrders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.customer} - {order.part_number} (Remaining: {order.remaining_quantity || 0})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <div style={{
                  background: 'var(--bg-base)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Original Qty:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {selectedOrder.original_quantity || selectedOrder.quantity}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Stock:</span>
                    <span style={{ color: '#00C853', fontWeight: '600' }}>
                      {selectedOrder.available_stock || 0}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Net Required:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {selectedOrder.net_required_quantity || selectedOrder.quantity}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
                    <span style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>
                      {selectedOrder.actual_units_completed || 0}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-default)',
                    paddingTop: '8px',
                    marginTop: '8px'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Remaining:</span>
                    <span style={{ color: 'var(--brand-primary)', fontWeight: '700', fontSize: '15px' }}>
                      {selectedOrder.remaining_quantity || 0}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    max={getToday()}
                    className="form-input-modal"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Quantity Produced</label>
                  <input
                    type="number"
                    value={formData.quantity_produced}
                    onChange={(e) => setFormData({ ...formData, quantity_produced: parseFloat(e.target.value) || 0 })}
                    className="form-input-modal"
                    min="0.001"
                    step="any"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Quantity Rejected</label>
                  <input
                    type="number"
                    value={formData.quantity_rejected}
                    onChange={(e) => setFormData({ ...formData, quantity_rejected: parseFloat(e.target.value) || 0 })}
                    className="form-input-modal"
                    min="0"
                    step="any"
                    placeholder="Optional"
                    data-testid="production-quantity-rejected-input"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Units that failed quality inspection
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!selectedOrderId}
                >
                  <Plus size={16} /> Log Production
                </button>
              </form>
            </>
          )}
        </div>

        {/* RIGHT PANEL: 14-Day Production Grid */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Last 14 Days Production
          </h3>

          {last14DaysLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <ClipboardList size={48} style={{ color: '#6E7681', marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                No production logged in the last 14 days.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Part Number</th>
                    <th>Produced</th>
                    <th>Rejected</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {last14DaysLogs.map(log => {
                    const order = orders.find(o => o.id === log.order_id);
                    return (
                      <tr key={log.id}>
                        <td>{new Date(log.date).toLocaleDateString()}</td>
                        <td>{order?.customer || '-'}</td>
                        <td className="mono-text">{log.part_number}</td>
                        <td style={{ fontWeight: '600', color: 'var(--brand-primary)' }}>
                          {log.quantity_produced}
                        </td>
                        <td style={{ fontWeight: '600', color: log.quantity_rejected > 0 ? '#FF5252' : 'var(--text-muted)' }}>
                          {log.quantity_rejected || 0}
                        </td>
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn-icon"
                              onClick={() => handleEdit(log)}
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleDelete(log.id)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* Edit Production Log Modal */}
      {editingLog && (
        <EditProductionLogModal
          log={editingLog}
          order={orders.find(o => o.id === editingLog.order_id)}
          onClose={() => setEditingLog(null)}
          onSave={(updates) => handleUpdate(editingLog.id, updates)}
        />
      )}
    </div>
  );
}

function EditProductionLogModal({ log, order, onClose, onSave }) {
  const [formData, setFormData] = useState({
    date: log.date,
    quantity_produced: log.quantity_produced,
    quantity_rejected: log.quantity_rejected || 0
  });

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.date > getToday()) {
      alert('Cannot log production for future dates');
      return;
    }

    if (formData.quantity_produced <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (formData.quantity_rejected < 0) {
      alert('Quantity rejected cannot be negative');
      return;
    }

    if (formData.quantity_rejected > formData.quantity_produced) {
      alert('Quantity rejected cannot exceed quantity produced');
      return;
    }

    onSave({
      date: formData.date,
      quantity_produced: parseFloat(formData.quantity_produced),
      quantity_rejected: parseFloat(formData.quantity_rejected) || 0
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <h2 className="modal-title">Edit Production Log</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Order</label>
            <input
              type="text"
              value={`${order?.customer} - ${log.part_number}`}
              className="form-input-modal"
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={getToday()}
              className="form-input-modal"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quantity Produced</label>
            <input
              type="number"
              value={formData.quantity_produced}
              onChange={(e) => setFormData({ ...formData, quantity_produced: parseFloat(e.target.value) || 0 })}
              className="form-input-modal"
              min="0.001"
              step="any"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quantity Rejected</label>
            <input
              type="number"
              value={formData.quantity_rejected}
              onChange={(e) => setFormData({ ...formData, quantity_rejected: parseFloat(e.target.value) || 0 })}
              className="form-input-modal"
              min="0"
              step="any"
              placeholder="Optional"
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Units that failed quality inspection
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
