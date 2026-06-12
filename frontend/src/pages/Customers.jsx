import { useState, useEffect } from 'react';
import { customerAPI } from '../api/client';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

const emptyCustomer = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      const res = await customerAPI.getAll(search ? { search } : {});
      setCustomers(res.data);
    } catch (err) {
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setEditingCustomer(null);
    setForm(emptyCustomer);
    setModalOpen(true);
  }

  function openEdit(customer) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCustomer) {
        await customerAPI.update(editingCustomer.id, form);
        addToast('Customer updated successfully');
      } else {
        await customerAPI.create(form);
        addToast('Customer created successfully');
      }
      setModalOpen(false);
      loadCustomers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save customer';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await customerAPI.delete(deleteConfirm.id);
      addToast('Customer deleted successfully');
      setDeleteConfirm(null);
      loadCustomers();
    } catch (err) {
      addToast('Failed to delete customer', 'error');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer directory</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="add-customer-btn">
          + Add Customer
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="customer-search"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : customers.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td><strong>{customer.name}</strong></td>
                  <td className="text-secondary">{customer.email}</td>
                  <td>{customer.phone || '—'}</td>
                  <td>
                    <span className="text-sm">
                      {customer.address
                        ? customer.address.length > 40
                          ? customer.address.slice(0, 40) + '...'
                          : customer.address
                        : '—'}
                    </span>
                  </td>
                  <td className="text-secondary text-sm">
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(customer)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteConfirm(customer)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="table-empty">
            <div className="table-empty-icon">👥</div>
            <p>No customers found. Add your first customer!</p>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Rahul Verma"
                id="customer-name-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="e.g. rahul@example.com"
                id="customer-email-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. +91-98765-43210"
              id="customer-phone-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-textarea"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full address..."
              id="customer-address-input"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Customer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </>
        }
      >
        <div className="confirm-dialog-body">
          <div className="confirm-dialog-icon">⚠️</div>
          <p className="confirm-dialog-text">
            Are you sure you want to delete{' '}
            <span className="confirm-dialog-highlight">{deleteConfirm?.name}</span>?
          </p>
          <p className="confirm-dialog-text text-sm">This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
}
