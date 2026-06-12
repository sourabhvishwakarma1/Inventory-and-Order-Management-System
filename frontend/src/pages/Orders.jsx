import { useState, useEffect } from 'react';
import { orderAPI, customerAPI, productAPI } from '../api/client';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Create order state
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [saving, setSaving] = useState(false);

  const addToast = useToast();

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await orderAPI.getAll(statusFilter ? { status: statusFilter } : {});
      setOrders(res.data);
    } catch (err) {
      addToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function openCreateModal() {
    try {
      const [custRes, prodRes] = await Promise.all([
        customerAPI.getAll(),
        productAPI.getAll(),
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
      setSelectedCustomer('');
      setOrderItems([{ product_id: '', quantity: 1 }]);
      setCreateModalOpen(true);
    } catch (err) {
      addToast('Failed to load data for order creation', 'error');
    }
  }

  async function openDetailModal(order) {
    try {
      const res = await orderAPI.getById(order.id);
      setSelectedOrder(res.data);
      setDetailModalOpen(true);
    } catch (err) {
      addToast('Failed to load order details', 'error');
    }
  }

  function addItem() {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  }

  function removeItem(index) {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }

  function updateItem(index, field, value) {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  }

  function calculateTotal() {
    return orderItems.reduce((total, item) => {
      const product = products.find((p) => p.id === parseInt(item.product_id));
      if (product && item.quantity > 0) {
        return total + product.price * item.quantity;
      }
      return total;
    }, 0);
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    if (!selectedCustomer) {
      addToast('Please select a customer', 'warning');
      return;
    }

    const validItems = orderItems.filter(
      (item) => item.product_id && item.quantity > 0
    );
    if (validItems.length === 0) {
      addToast('Please add at least one product', 'warning');
      return;
    }

    setSaving(true);
    try {
      await orderAPI.create({
        customer_id: parseInt(selectedCustomer),
        items: validItems.map((item) => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
        })),
      });
      addToast('Order created successfully');
      setCreateModalOpen(false);
      loadOrders();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object' && detail.message) {
        let msg = detail.message;
        if (detail.insufficient_items) {
          const items = detail.insufficient_items
            .map((i) => `${i.product_name} (need ${i.requested}, have ${i.available})`)
            .join(', ');
          msg += ': ' + items;
        }
        addToast(msg, 'error');
      } else {
        addToast(detail || 'Failed to create order', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(orderId, newStatus) {
    try {
      await orderAPI.updateStatus(orderId, { status: newStatus });
      addToast(`Order status updated to ${newStatus}`);
      if (selectedOrder?.id === orderId) {
        const res = await orderAPI.getById(orderId);
        setSelectedOrder(res.data);
      }
      loadOrders();
    } catch (err) {
      addToast('Failed to update order status', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await orderAPI.delete(deleteConfirm.id);
      addToast('Order deleted successfully');
      setDeleteConfirm(null);
      loadOrders();
    } catch (err) {
      addToast('Failed to delete order', 'error');
    }
  }

  const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Track and manage customer orders</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} id="create-order-btn">
          + New Order
        </button>
      </div>

      <div className="search-bar">
        <select
          className="form-select"
          style={{ maxWidth: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          id="order-status-filter"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : orders.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="font-mono text-sm">#{String(order.id).padStart(4, '0')}</span>
                  </td>
                  <td>
                    <div>
                      <strong>{order.customer_name || 'N/A'}</strong>
                      <div className="text-secondary text-xs">{order.customer_email}</div>
                    </div>
                  </td>
                  <td>{order.items?.length || 0} items</td>
                  <td><strong>₹{order.total_amount?.toFixed(2)}</strong></td>
                  <td>
                    <span className={`badge badge-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-secondary text-sm">
                    {order.order_date
                      ? new Date(order.order_date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openDetailModal(order)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteConfirm(order)}
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
            <div className="table-empty-icon">🛒</div>
            <p>No orders found. Create your first order!</p>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Order"
        large
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateOrder}
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Order'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder}>
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select
              className="form-select"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
              id="order-customer-select"
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <label className="form-label">Order Items *</label>
          <div className="order-items-list">
            {orderItems.map((item, index) => {
              const selectedProduct = products.find(
                (p) => p.id === parseInt(item.product_id)
              );
              return (
                <div key={index} className="order-item-row">
                  <div className="form-group">
                    <label className="form-label text-xs">Product</label>
                    <select
                      className="form-select"
                      value={item.product_id}
                      onChange={(e) =>
                        updateItem(index, 'product_id', e.target.value)
                      }
                      required
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                          {p.name} — ₹{p.price.toFixed(2)} (Stock: {p.stock_quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Qty</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max={selectedProduct?.stock_quantity || 999}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, 'quantity', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Subtotal</label>
                    <div className="detail-value" style={{ padding: '8px 0' }}>
                      ₹{selectedProduct
                        ? (selectedProduct.price * item.quantity).toFixed(2)
                        : '0.00'}
                    </div>
                  </div>
                  <div className="form-group">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeItem(index)}
                      disabled={orderItems.length === 1}
                      style={{ marginTop: '20px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
            + Add Item
          </button>

          <div className="order-summary">
            <div className="order-summary-row order-summary-total">
              <span>Total</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Order #${String(selectedOrder?.id || '').padStart(4, '0')}`}
        large
        footer={
          <button className="btn btn-secondary" onClick={() => setDetailModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedOrder && (
          <>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Customer</span>
                <span className="detail-value">{selectedOrder.customer_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{selectedOrder.customer_email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Order Date</span>
                <span className="detail-value">
                  {selectedOrder.order_date
                    ? new Date(selectedOrder.order_date).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <div>
                  <select
                    className="form-select"
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleStatusUpdate(selectedOrder.id, e.target.value)
                    }
                    style={{ maxWidth: '200px' }}
                    id="order-status-update"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <h4 className="card-title mb-4">Order Items</h4>
            <div className="table-container mb-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name || 'N/A'}</td>
                      <td className="font-mono text-sm">{item.product_sku || 'N/A'}</td>
                      <td>₹{item.unit_price?.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td><strong>₹{item.subtotal?.toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="order-summary">
              <div className="order-summary-row order-summary-total">
                <span>Total Amount</span>
                <span>₹{selectedOrder.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Order"
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
            Are you sure you want to delete order{' '}
            <span className="confirm-dialog-highlight">
              #{String(deleteConfirm?.id || '').padStart(4, '0')}
            </span>?
          </p>
          <p className="confirm-dialog-text text-sm">
            Stock will be restored for non-cancelled orders.
          </p>
        </div>
      </Modal>
    </div>
  );
}
