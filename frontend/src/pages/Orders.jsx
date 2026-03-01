import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Edit2, Trash2, Package, Copy, Plus, X } from 'lucide-react';
import { calculateDeliveryRisk } from '../services/schedulingEngine';

export default function Orders() {
  console.log("Orders mounted");
  const { orders, workCenters, editOrder, deleteOrder, addOrder } = useData();
  const [editingOrder, setEditingOrder] = useState(null);
  const [duplicatingOrder, setDuplicatingOrder] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 3: return 'High';
      case 2: return 'Normal';
      case 1: return 'Low';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return '#00C853';
      case 'IN_PROGRESS': return '#2979FF';
      case 'PLANNED': return '#8B949E';
      case 'DELAYED': return '#D50000';
      default: return '#8B949E';
    }
  };

  const handleDelete = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrder(orderId);
    }
  };

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>All Orders ({orders.length})</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setCreatingOrder(true)}
          data-testid="create-order-button"
        >
          <Plus size={16} /> Create Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state-large" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Package size={48} style={{ color: '#6E7681', marginBottom: '16px' }} />
          <h3 style={{ color: '#E6EDF3', marginBottom: '8px' }}>No Orders Yet</h3>
          <p style={{ color: '#8B949E', marginBottom: '24px' }}>
            Click the "+ Create Order" button above to start scheduling production
          </p>
        </div>
      ) : (
        <div className="orders-table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Part Number</th>
                <th>Qty (Orig/Stock/Net)</th>
                <th>Priority</th>
                <th>Start Date</th>
                <th>Due Date</th>
                <th>Completion</th>
                <th>Status</th>
                <th>Delay</th>
                <th>Risk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const risk = calculateDeliveryRisk(order);
                const origQty = order.original_quantity || order.quantity;
                const stock = order.available_stock || 0;
                const netQty = order.net_required_quantity !== undefined ? order.net_required_quantity : order.quantity;
                
                return (
                  <tr key={order.id}>
                    <td className="mono-text">{order.id.substring(0, 12)}...</td>
                    <td>{order.customer}</td>
                    <td>{order.part_number || '-'}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{origQty}</span>
                        {stock > 0 && (
                          <>
                            <span style={{ color: 'var(--text-tertiary)' }}> / </span>
                            <span style={{ color: '#00C853' }}>{stock}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}> / </span>
                            <span style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>{netQty}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${order.priority === 3 ? 'badge-danger' : order.priority === 2 ? 'badge-warning' : 'badge-info'}`}>
                        {getPriorityLabel(order.priority)}
                      </span>
                    </td>
                    <td>{order.start_date ? new Date(order.start_date).toLocaleDateString() : '-'}</td>
                    <td>{new Date(order.due_date).toLocaleDateString()}</td>
                    <td>
                      {order.planned_completion_date ? 
                        new Date(order.planned_completion_date).toLocaleDateString() : 
                        <span style={{ color: '#D50000' }}>Unscheduled</span>
                      }
                    </td>
                    <td>
                      <span style={{ color: getStatusColor(order.status) }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ color: order.delay_days > 0 ? '#D50000' : '#6E7681' }}>
                      {order.delay_days > 0 ? `+${order.delay_days}d` : '-'}
                    </td>
                    <td>
                      <span style={{ 
                        color: risk > 75 ? '#D50000' : risk > 50 ? '#FFB300' : '#00C853',
                        fontWeight: 600 
                      }}>
                        {Math.round(risk)}%
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-icon" 
                          onClick={() => setEditingOrder(order)}
                          title="Edit Order"
                          data-testid={`edit-order-${order.id}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => setDuplicatingOrder(order)}
                          title="Duplicate Order"
                          style={{ color: 'var(--brand-primary)' }}
                          data-testid={`duplicate-order-${order.id}`}
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          className="btn-icon btn-danger" 
                          onClick={() => handleDelete(order.id)}
                          title="Delete Order"
                          data-testid={`delete-order-${order.id}`}
                        >
                          <Trash2 size={16} />
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

      {editingOrder && (
        <EditOrderModal 
          order={editingOrder}
          workCenters={workCenters}
          onClose={() => setEditingOrder(null)}
          onSave={(updates) => {
            editOrder(editingOrder.id, updates);
            setEditingOrder(null);
          }}
        />
      )}

      {duplicatingOrder && (
        <DuplicateOrderModal 
          order={duplicatingOrder}
          workCenters={workCenters}
          onClose={() => setDuplicatingOrder(null)}
          onSave={(newOrder) => {
            addOrder(newOrder);
            setDuplicatingOrder(null);
          }}
        />
      )}

      {creatingOrder && (
        <CreateOrderModal 
          workCenters={workCenters}
          parts={parts}
          onClose={() => setCreatingOrder(false)}
          onSave={(newOrder) => {
            addOrder(newOrder);
            setCreatingOrder(false);
          }}
        />
      )}
    </div>
  );
}

function CreateOrderModal({ workCenters, parts, onClose, onSave }) {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    customer: '',
    part_number: '',
    quantity: 100,
    available_stock: 0,
    priority: 2,
    start_date: today,
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    routing: [
      {
        sequence_number: 1,
        work_center_id: workCenters[0]?.id || '',
        cycle_time_minutes: 1,
        setup_time_hours: 0
      }
    ]
  });

  // Handle part selection - auto-fill routing from Part Master
  const handlePartSelect = (e) => {
    const selectedPartNumber = e.target.value;
    setFormData({ ...formData, part_number: selectedPartNumber });
    
    if (selectedPartNumber) {
      const selectedPart = parts.find(p => p.part_number === selectedPartNumber);
      if (selectedPart && selectedPart.default_routing) {
        // Deep copy routing from part master
        const copiedRouting = JSON.parse(JSON.stringify(selectedPart.default_routing));
        setFormData({
          ...formData,
          part_number: selectedPartNumber,
          routing: copiedRouting
        });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate net required quantity
    const netRequired = Math.max(0, formData.quantity - formData.available_stock);
    
    // Create new order with stock calculations
    const newOrder = {
      customer: formData.customer,
      part_number: formData.part_number,
      original_quantity: formData.quantity,
      available_stock: formData.available_stock,
      net_required_quantity: netRequired,
      quantity: netRequired, // This is what scheduling engine uses
      priority: formData.priority,
      start_date: formData.start_date,
      due_date: new Date(formData.due_date).toISOString(),
      actual_units_completed: 0,
      status: netRequired === 0 ? 'COMPLETED' : 'PLANNED',
      routing: formData.routing.map(step => ({
        ...step,
        completion_date: netRequired === 0 ? new Date().toISOString().split('T')[0] : null,
        scheduled_days: [],
        total_units_completed: netRequired === 0 ? netRequired : 0,
        units_in_progress: 0,
        required_hours: 0
      }))
    };
    
    // If net required is 0, mark as completed immediately
    if (netRequired === 0) {
      newOrder.planned_completion_date = new Date().toISOString().split('T')[0];
      newOrder.delayed = false;
      newOrder.delay_days = 0;
    }
    
    onSave(newOrder);
  };

  const updateRoutingStep = (index, field, value) => {
    const newRouting = [...formData.routing];
    if (field.includes('time')) {
      const numValue = value === '' ? '' : parseFloat(value);
      newRouting[index][field] = numValue;
    } else {
      newRouting[index][field] = value;
    }
    setFormData({ ...formData, routing: newRouting });
  };

  const addRoutingStep = () => {
    const newRouting = [...formData.routing];
    newRouting.push({
      sequence_number: newRouting.length + 1,
      work_center_id: workCenters[0]?.id || '',
      cycle_time_minutes: 1,
      setup_time_hours: 0
    });
    setFormData({ ...formData, routing: newRouting });
  };

  const removeRoutingStep = (index) => {
    if (formData.routing.length === 1) {
      alert('Order must have at least one routing step');
      return;
    }
    const newRouting = formData.routing.filter((_, i) => i !== index);
    // Renumber sequence
    newRouting.forEach((step, i) => {
      step.sequence_number = i + 1;
    });
    setFormData({ ...formData, routing: newRouting });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-title">Create New Order</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Basic Info */}
          <div className="form-group">
            <label className="form-label">Customer</label>
            <input
              type="text"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="form-input-modal"
              placeholder="Customer name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Part Number</label>
            <input
              type="text"
              value={formData.part_number}
              onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
              className="form-input-modal"
              placeholder="Part number"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity Required</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className="form-input-modal"
                required
                min="1"
                step="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Available Stock</label>
              <input
                type="number"
                value={formData.available_stock}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setFormData({ ...formData, available_stock: value });
                }}
                className="form-input-modal"
                min="0"
                step="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Net To Produce</label>
              <input
                type="number"
                value={Math.max(0, formData.quantity - formData.available_stock)}
                className="form-input-modal"
                disabled
                style={{ background: 'var(--bg-elevated)', color: 'var(--brand-primary)', fontWeight: '600' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="form-input-modal"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="form-input-modal"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) })}
                className="form-input-modal"
              >
                <option value={3}>High (3)</option>
                <option value={2}>Normal (2)</option>
                <option value={1}>Low (1)</option>
              </select>
            </div>
          </div>

          {Math.max(0, formData.quantity - formData.available_stock) === 0 && formData.quantity > 0 && (
            <div style={{
              background: 'rgba(0, 200, 83, 0.1)',
              border: '1px solid rgba(0, 200, 83, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#00C853',
              marginBottom: '16px'
            }}>
              ✓ This order will be marked as COMPLETED (fulfilled from available stock)
            </div>
          )}

          {/* Routing Steps */}
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label className="form-label" style={{ margin: 0 }}>Routing Steps</label>
              <button
                type="button"
                onClick={addRoutingStep}
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                <Plus size={16} /> Add Step
              </button>
            </div>

            {formData.routing.map((step, index) => (
              <div key={index} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Step {step.sequence_number}
                  </span>
                  {formData.routing.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoutingStep(index)}
                      className="btn-icon btn-danger"
                      style={{ padding: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Work Center</label>
                    <select
                      value={step.work_center_id}
                      onChange={(e) => updateRoutingStep(index, 'work_center_id', e.target.value)}
                      className="form-input-modal"
                      style={{ fontSize: '13px' }}
                    >
                      {workCenters.map(wc => (
                        <option key={wc.id} value={wc.id}>{wc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Cycle Time (min)</label>
                    <input
                      type="number"
                      value={step.cycle_time_minutes}
                      onChange={(e) => updateRoutingStep(index, 'cycle_time_minutes', e.target.value)}
                      className="form-input-modal"
                      style={{ fontSize: '13px' }}
                      step="any"
                      min="0.000001"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Setup Time (hrs)</label>
                    <input
                      type="number"
                      value={step.setup_time_hours}
                      onChange={(e) => updateRoutingStep(index, 'setup_time_hours', e.target.value)}
                      className="form-input-modal"
                      style={{ fontSize: '13px' }}
                      step="any"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditOrderModal({ order, workCenters, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customer: order.customer,
    part_number: order.part_number || '',
    quantity: order.quantity,
    priority: order.priority,
    start_date: order.start_date ? order.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
    due_date: order.due_date.split('T')[0],
    routing: order.routing.map(step => ({ ...step }))
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateRoutingStep = (index, field, value) => {
    const newRouting = [...formData.routing];
    if (field.includes('time')) {
      const numValue = value === '' ? '' : parseFloat(value);
      newRouting[index][field] = numValue;
    } else {
      newRouting[index][field] = value;
    }
    setFormData({ ...formData, routing: newRouting });
  };

  const addRoutingStep = () => {
    const newRouting = [...formData.routing];
    newRouting.push({
      sequence_number: newRouting.length + 1,
      work_center_id: workCenters[0]?.id || '',
      cycle_time_minutes: 1,
      setup_time_hours: 0
    });
    setFormData({ ...formData, routing: newRouting });
  };

  const removeRoutingStep = (index) => {
    if (formData.routing.length === 1) {
      alert('Order must have at least one routing step');
      return;
    }
    const newRouting = formData.routing.filter((_, i) => i !== index);
    // Renumber sequence
    newRouting.forEach((step, i) => {
      step.sequence_number = i + 1;
    });
    setFormData({ ...formData, routing: newRouting });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-title">Edit Order</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Basic Info */}
          <div className="form-group">
            <label className="form-label">Customer</label>
            <input
              type="text"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="form-input-modal"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Part Number</label>
            <input
              type="text"
              value={formData.part_number}
              onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
              className="form-input-modal"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className="form-input-modal"
                required
                min="1"
                step="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) })}
                className="form-input-modal"
              >
                <option value={3}>High (3)</option>
                <option value={2}>Normal (2)</option>
                <option value={1}>Low (1)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="form-input-modal"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="form-input-modal"
                required
              />
            </div>
          </div>

          {/* Routing Steps */}
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label className="form-label" style={{ margin: 0 }}>Routing Steps</label>
              <button
                type="button"
                onClick={addRoutingStep}
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                <Plus size={16} /> Add Step
              </button>
            </div>

            {formData.routing.map((step, index) => (
              <div key={index} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Step {step.sequence_number}
                  </span>
                  {formData.routing.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoutingStep(index)}
                      className="btn-icon btn-danger"
                      style={{ padding: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Work Center</label>
                    <select
                      value={step.work_center_id}
                      onChange={(e) => updateRoutingStep(index, 'work_center_id', e.target.value)}
                      className="form-input-modal"
                      style={{ fontSize: '13px' }}
                    >
                      {workCenters.map(wc => (
                        <option key={wc.id} value={wc.id}>{wc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Cycle Time (min)</label>
                    <input
                      type="number"
                      value={step.cycle_time_minutes}
                      onChange={(e) => updateRoutingStep(index, 'cycle_time_minutes', e.target.value)}
                      className="form-input-modal"
                      style={{ fontSize: '13px' }}
                      step="any"
                      min="0.000001"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Setup Time (hrs)</label>
                    <input
                      type="number"
                      value={step.setup_time_hours}
                      onChange={(e) => updateRoutingStep(index, 'setup_time_hours', e.target.value)}
                      className="form-input-modal"
                      style={{ fontSize: '13px' }}
                      step="any"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
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

function DuplicateOrderModal({ order, workCenters, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customer: order.customer + ' (Copy)',
    quantity: order.quantity,
    priority: order.priority,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    routing: order.routing.map(step => ({
      sequence_number: step.sequence_number,
      work_center_id: step.work_center_id,
      cycle_time_minutes: step.cycle_time_minutes,
      setup_time_hours: step.setup_time_hours
    }))
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create new order with reset scheduling data
    const newOrder = {
      ...formData,
      due_date: new Date(formData.due_date).toISOString(),
      status: 'PLANNED',
      routing: formData.routing.map(step => ({
        ...step,
        // Reset scheduling data
        completion_date: null,
        scheduled_days: [],
        total_units_completed: 0,
        units_in_progress: 0,
        required_hours: 0
      }))
    };
    
    onSave(newOrder);
  };

  const updateRoutingStep = (index, field, value) => {
    const newRouting = [...formData.routing];
    if (field.includes('time')) {
      const numValue = value === '' ? '' : parseFloat(value);
      newRouting[index][field] = numValue;
    } else {
      newRouting[index][field] = value;
    }
    setFormData({ ...formData, routing: newRouting });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Copy size={24} style={{ color: 'var(--brand-primary)' }} />
          Duplicate Order
        </h2>
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Basic Info */}
          <div className="form-group">
            <label className="form-label">Customer</label>
            <input
              type="text"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="form-input-modal"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="form-input-modal"
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="form-input-modal"
              >
                <option value={3}>High (3)</option>
                <option value={2}>Normal (2)</option>
                <option value={1}>Low (1)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="form-input-modal"
                required
              />
            </div>
          </div>

          {/* Routing Steps Preview */}
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '16px' }}>Routing Steps (Duplicated)</label>

            {formData.routing.map((step, index) => (
              <div key={index} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Step {step.sequence_number}
                  </span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Work Center</label>
                    <select
                      value={step.work_center_id}
                      onChange={(e) => updateRoutingStep(index, 'work_center_id', e.target.value)}
                      className="form-input-modal"
                      style={{ fontSize: '13px' }}
                    >
                      {workCenters.map(wc => (
                        <option key={wc.id} value={wc.id}>{wc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Cycle Time (min)</label>
                    <input
                      type="number"
                      value={step.cycle_time_minutes}
                      onChange={(e) => updateRoutingStep(index, 'cycle_time_minutes', e.target.value)}
                      className="form-input-modal"
                      style={{ fontSize: '13px' }}
                      step="any"
                      min="0.000001"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px' }}>Setup Time (hrs)</label>
                    <input
                      type="number"
                      value={step.setup_time_hours}
                      onChange={(e) => updateRoutingStep(index, 'setup_time_hours', e.target.value)}
                      className="form-input-modal"
                      style={{ fontSize: '13px' }}
                      step="any"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(0, 255, 198, 0.08)',
            border: '1px solid rgba(0, 255, 198, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          }}>
            ℹ️ Scheduling data will be reset for the new order. All routing steps and parameters are duplicated from the original order.
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Duplicate Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// End of Orders.jsx
