import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Edit2, Trash2, Package, Plus, X } from 'lucide-react';

export default function Parts() {
  const { parts, workCenters, addPart, updatePart, deletePart } = useData();
  const [editingPart, setEditingPart] = useState(null);
  const [creatingPart, setCreatingPart] = useState(false);

  const handleDelete = (partId) => {
    if (window.confirm('Are you sure you want to delete this part?')) {
      deletePart(partId);
    }
  };

  return (
    <div className="content-area" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Parts ({parts.length})
        </h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setCreatingPart(true)}
          data-testid="add-part-button"
        >
          <Plus size={16} /> Add Part
        </button>
      </div>

      {parts.length === 0 ? (
        <div className="empty-state-large" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Package size={48} style={{ color: '#6E7681', marginBottom: '16px' }} />
          <h3 style={{ color: '#E6EDF3', marginBottom: '8px' }}>No Parts Yet</h3>
          <p style={{ color: '#8B949E', marginBottom: '24px' }}>
            Click the "+ Add Part" button above to create your first part with routing
          </p>
        </div>
      ) : (
        <div className="parts-table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Description</th>
                <th># Steps</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(part => (
                <tr key={part.id}>
                  <td className="mono-text" style={{ fontWeight: '600' }}>{part.part_number}</td>
                  <td>{part.description}</td>
                  <td>{part.default_routing?.length || 0}</td>
                  <td>
                    <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-icon" 
                        onClick={() => setEditingPart(part)}
                        title="Edit Part"
                        data-testid={`edit-part-${part.id}`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon btn-danger" 
                        onClick={() => handleDelete(part.id)}
                        title="Delete Part"
                        data-testid={`delete-part-${part.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creatingPart && (
        <AddPartModal 
          workCenters={workCenters}
          onClose={() => setCreatingPart(false)}
          onSave={(newPart) => {
            addPart(newPart);
            setCreatingPart(false);
          }}
        />
      )}

      {editingPart && (
        <EditPartModal 
          part={editingPart}
          workCenters={workCenters}
          onClose={() => setEditingPart(null)}
          onSave={(updates) => {
            updatePart(editingPart.id, updates);
            setEditingPart(null);
          }}
        />
      )}
    </div>
  );
}

function AddPartModal({ workCenters, onClose, onSave }) {
  const [formData, setFormData] = useState({
    part_number: '',
    description: '',
    default_routing: [
      {
        sequence_number: 1,
        work_center_id: workCenters[0]?.id || '',
        cycle_time_minutes: 1,
        setup_time_hours: 0
      }
    ]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateRoutingStep = (index, field, value) => {
    const newRouting = [...formData.default_routing];
    if (field.includes('time')) {
      const numValue = value === '' ? '' : parseFloat(value);
      newRouting[index][field] = numValue;
    } else {
      newRouting[index][field] = value;
    }
    setFormData({ ...formData, default_routing: newRouting });
  };

  const addRoutingStep = () => {
    const newRouting = [...formData.default_routing];
    newRouting.push({
      sequence_number: newRouting.length + 1,
      work_center_id: workCenters[0]?.id || '',
      cycle_time_minutes: 1,
      setup_time_hours: 0
    });
    setFormData({ ...formData, default_routing: newRouting });
  };

  const removeRoutingStep = (index) => {
    if (formData.default_routing.length === 1) {
      alert('Part must have at least one routing step');
      return;
    }
    const newRouting = formData.default_routing.filter((_, i) => i !== index);
    // Renumber sequence
    newRouting.forEach((step, i) => {
      step.sequence_number = i + 1;
    });
    setFormData({ ...formData, default_routing: newRouting });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-title">Add New Part</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Part Number</label>
            <input
              type="text"
              value={formData.part_number}
              onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
              className="form-input-modal"
              placeholder="e.g., PART-12345"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input-modal"
              placeholder="Part description"
              required
            />
          </div>

          {/* Default Routing Steps */}
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label className="form-label" style={{ margin: 0 }}>Default Routing</label>
              <button
                type="button"
                onClick={addRoutingStep}
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                <Plus size={16} /> Add Step
              </button>
            </div>

            {formData.default_routing.map((step, index) => (
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
                  {formData.default_routing.length > 1 && (
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
              Add Part
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPartModal({ part, workCenters, onClose, onSave }) {
  const [formData, setFormData] = useState({
    part_number: part.part_number,
    description: part.description,
    default_routing: part.default_routing.map(step => ({ ...step }))
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateRoutingStep = (index, field, value) => {
    const newRouting = [...formData.default_routing];
    if (field.includes('time')) {
      const numValue = value === '' ? '' : parseFloat(value);
      newRouting[index][field] = numValue;
    } else {
      newRouting[index][field] = value;
    }
    setFormData({ ...formData, default_routing: newRouting });
  };

  const addRoutingStep = () => {
    const newRouting = [...formData.default_routing];
    newRouting.push({
      sequence_number: newRouting.length + 1,
      work_center_id: workCenters[0]?.id || '',
      cycle_time_minutes: 1,
      setup_time_hours: 0
    });
    setFormData({ ...formData, default_routing: newRouting });
  };

  const removeRoutingStep = (index) => {
    if (formData.default_routing.length === 1) {
      alert('Part must have at least one routing step');
      return;
    }
    const newRouting = formData.default_routing.filter((_, i) => i !== index);
    // Renumber sequence
    newRouting.forEach((step, i) => {
      step.sequence_number = i + 1;
    });
    setFormData({ ...formData, default_routing: newRouting });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-title">Edit Part</h2>
        <form onSubmit={handleSubmit} className="modal-form">
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

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input-modal"
              required
            />
          </div>

          {/* Default Routing Steps */}
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label className="form-label" style={{ margin: 0 }}>Default Routing</label>
              <button
                type="button"
                onClick={addRoutingStep}
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                <Plus size={16} /> Add Step
              </button>
            </div>

            {formData.default_routing.map((step, index) => (
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
                  {formData.default_routing.length > 1 && (
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
