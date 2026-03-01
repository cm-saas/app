import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Settings, Plus, X } from 'lucide-react';

export default function Capacity() {
  const { workCenters, editWorkCenter, addWorkCenter, addBreakdown, removeBreakdown, addOvertime } = useData();
  const [editingWC, setEditingWC] = useState(null);
  const [addingBreakdown, setAddingBreakdown] = useState(null);
  const [addingOvertime, setAddingOvertime] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Work Centers ({workCenters.length})</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          data-testid="add-workcenter-btn"
        >
          <Plus size={18} />
          Add Work Center
        </button>
      </div>

      <div className="wc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {workCenters.map(wc => (
          <div key={wc.id} className="card" style={{ padding: '20px' }}>
            <div className="wc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{wc.name}</h3>
              <button 
                className="btn-icon"
                onClick={() => setEditingWC(wc)}
                data-testid={`edit-wc-${wc.id}`}
              >
                <Settings size={18} />
              </button>
            </div>

            <div className="wc-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="wc-stat">
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shift Hours/Day</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{wc.shift_hours_per_day}h</span>
              </div>
              <div className="wc-stat">
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shifts</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{wc.number_of_shifts}</span>
              </div>
              <div className="wc-stat">
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Efficiency</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{(wc.efficiency_percent * 100).toFixed(0)}%</span>
              </div>
              <div className="wc-stat">
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parallel Units</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{wc.parallel_units || 1}</span>
              </div>
            </div>

            <div className="wc-section" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Breakdowns</span>
                <button 
                  className="btn-icon"
                  onClick={() => setAddingBreakdown(wc.id)}
                  style={{ padding: '4px' }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {wc.breakdowns && wc.breakdowns.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {wc.breakdowns.map((b, idx) => (
                    <span key={idx} className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {b.date}
                      <button 
                        onClick={() => removeBreakdown(wc.id, b.date)}
                        style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', display: 'flex' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>No breakdowns</p>
              )}
            </div>

            <div className="wc-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Overtime</span>
                <button 
                  className="btn-icon"
                  onClick={() => setAddingOvertime(wc.id)}
                  style={{ padding: '4px' }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {wc.overtime_rules && wc.overtime_rules.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {wc.overtime_rules.map((ot, idx) => (
                    <span key={idx} className="badge badge-success">
                      {ot.date}: +{ot.overtime_hours}h
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>No overtime scheduled</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingWC && (
        <EditWCModal 
          wc={editingWC}
          onClose={() => setEditingWC(null)}
          onSave={(updates) => {
            editWorkCenter(editingWC.id, updates);
            setEditingWC(null);
          }}
        />
      )}

      {addingBreakdown && (
        <AddBreakdownModal 
          wcId={addingBreakdown}
          onClose={() => setAddingBreakdown(null)}
          onAdd={(date) => {
            addBreakdown(addingBreakdown, date);
            setAddingBreakdown(null);
          }}
        />
      )}

      {addingOvertime && (
        <AddOvertimeModal 
          wcId={addingOvertime}
          onClose={() => setAddingOvertime(null)}
          onAdd={(date, hours) => {
            addOvertime(addingOvertime, date, hours);
            setAddingOvertime(null);
          }}
        />
      )}

      {showCreateModal && (
        <CreateWCModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={async (wcData) => {
            await addWorkCenter(wcData);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function EditWCModal({ wc, onClose, onSave }) {
  const [formData, setFormData] = useState({
    shift_hours_per_day: wc.shift_hours_per_day,
    number_of_shifts: wc.number_of_shifts,
    efficiency_percent: wc.efficiency_percent,
    parallel_units: wc.parallel_units || 1
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit {wc.name}</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="modal-form">
          <div className="form-group">
            <label className="form-label">Shift Hours/Day</label>
            <input
              type="number"
              value={formData.shift_hours_per_day}
              onChange={(e) => setFormData({ ...formData, shift_hours_per_day: parseFloat(e.target.value) })}
              className="form-input-modal"
              step="0.5"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Number of Shifts</label>
            <input
              type="number"
              value={formData.number_of_shifts}
              onChange={(e) => setFormData({ ...formData, number_of_shifts: parseInt(e.target.value) })}
              className="form-input-modal"
              min="1"
              max="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Efficiency (%)</label>
            <input
              type="number"
              value={formData.efficiency_percent * 100}
              onChange={(e) => setFormData({ ...formData, efficiency_percent: parseFloat(e.target.value) / 100 })}
              className="form-input-modal"
              step="1"
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cost per Hour (₹)</label>
            <input
              type="number"
              value={formData.cost_per_hour || 0}
              onChange={(e) => setFormData({ ...formData, cost_per_hour: parseFloat(e.target.value) })}
              className="form-input-modal"
              step="10"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Parallel Units</label>
            <input
              type="number"
              value={formData.parallel_units}
              onChange={(e) => setFormData({ ...formData, parallel_units: parseInt(e.target.value) })}
              className="form-input-modal"
              min="1"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddBreakdownModal({ wcId, onClose, onAdd }) {
  const [date, setDate] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Breakdown</h2>
        <form onSubmit={(e) => { e.preventDefault(); onAdd(date); }} className="modal-form">
          <div className="form-group">
            <label className="form-label">Breakdown Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input-modal"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddOvertimeModal({ wcId, onClose, onAdd }) {
  const [date, setDate] = useState('');
  const [hours, setHours] = useState(4);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Overtime</h2>
        <form onSubmit={(e) => { e.preventDefault(); onAdd(date, hours); }} className="modal-form">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input-modal"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Overtime Hours</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value))}
              className="form-input-modal"
              step="0.5"
              min="0"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateWCModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    shift_hours_per_day: 8,
    number_of_shifts: 2,
    efficiency_percent: 0.95,
    cost_per_hour: 150,
    parallel_units: 1
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create Work Center</h2>
        <form onSubmit={(e) => { e.preventDefault(); onCreate(formData); }} className="modal-form">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input-modal"
              required
              placeholder="e.g., CNC Mill 02"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Shift Hours per Day</label>
            <input
              type="number"
              value={formData.shift_hours_per_day}
              onChange={(e) => setFormData({ ...formData, shift_hours_per_day: parseFloat(e.target.value) })}
              className="form-input-modal"
              step="0.5"
              min="0"
              max="24"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Number of Shifts</label>
            <input
              type="number"
              value={formData.number_of_shifts}
              onChange={(e) => setFormData({ ...formData, number_of_shifts: parseInt(e.target.value) })}
              className="form-input-modal"
              min="1"
              max="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Efficiency (%)</label>
            <input
              type="number"
              value={formData.efficiency_percent * 100}
              onChange={(e) => setFormData({ ...formData, efficiency_percent: parseFloat(e.target.value) / 100 })}
              className="form-input-modal"
              step="1"
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cost per Hour (₹)</label>
            <input
              type="number"
              value={formData.cost_per_hour}
              onChange={(e) => setFormData({ ...formData, cost_per_hour: parseFloat(e.target.value) })}
              className="form-input-modal"
              step="10"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Parallel Units</label>
            <input
              type="number"
              value={formData.parallel_units}
              onChange={(e) => setFormData({ ...formData, parallel_units: parseInt(e.target.value) })}
              className="form-input-modal"
              min="1"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">Create Work Center</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// End of Capacity.jsx
