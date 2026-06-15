import { useState, useEffect } from 'react';
import { productAPI } from '../api/client';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

const emptyProduct = {
  name: '',
  sku: '',
  description: '',
  price: '',
  stock_quantity: '',
  category: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const addToast = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await productAPI.getAll(search ? { search } : {});
      setProducts(res.data);
    } catch (err) {
      addToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setEditingProduct(null);
    setForm(emptyProduct);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      category: product.category || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity, 10),
      };

      if (editingProduct) {
        // Include SKU when editing
        data.sku = editingProduct.sku;
        await productAPI.update(editingProduct.id, data);
        addToast('Product updated successfully');
      } else {
        // Send SKU if user entered one, otherwise backend auto-generates
        if (!data.sku || data.sku.trim() === '') {
          delete data.sku;
        }
        await productAPI.create(data);
        addToast('Product created successfully');
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save product';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await productAPI.delete(deleteConfirm.id);
      addToast('Product deleted successfully');
      setDeleteConfirm(null);
      loadProducts();
    } catch (err) {
      addToast('Failed to delete product', 'error');
    }
  }

  function getStockClass(qty) {
    if (qty === 0) return 'stock-out';
    if (qty <= 10) return 'stock-low';
    return 'stock-good';
  }

  function getStockLabel(qty) {
    if (qty === 0) return 'Out of stock';
    if (qty <= 10) return 'Low stock';
    return 'In stock';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your inventory catalog</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="add-product-btn">
          + Add Product
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="product-search"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div>
                      <strong>{product.name}</strong>
                      {product.description && (
                        <div className="text-secondary text-xs" style={{ marginTop: '2px' }}>
                          {product.description.length > 60
                            ? product.description.slice(0, 60) + '...'
                            : product.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-sm">{product.sku}</span>
                  </td>
                  <td>{product.category || '—'}</td>
                  <td>₹{product.price.toFixed(2)}</td>
                  <td>
                    <div className={`stock-level ${getStockClass(product.stock_quantity)}`}>
                      <span className="stock-dot"></span>
                      {product.stock_quantity} · {getStockLabel(product.stock_quantity)}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(product)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteConfirm(product)}
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
            <div className="table-empty-icon">📦</div>
            <p>No products found. Add your first product!</p>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
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
              {saving ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Wireless Headphones"
                id="product-name-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">SKU {editingProduct ? '' : '(Optional)'}</label>
              <input
                className="form-input"
                value={editingProduct ? editingProduct.sku : form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                disabled={!!editingProduct}
                style={editingProduct ? { opacity: 0.6 } : {}}
                placeholder="Leave empty to auto-generate"
                id="product-sku-input"
              />
            </div>
          </div>
          {!editingProduct && (
            <p className="text-secondary text-xs" style={{ marginBottom: '12px' }}>💡 Leave SKU empty to auto-generate (e.g. PRD-001), or enter your own unique SKU</p>
          )}

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Product description..."
              id="product-description-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                placeholder="0.00"
                id="product-price-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Quantity *</label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                required
                placeholder="0"
                id="product-stock-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Electronics"
              id="product-category-input"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
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
