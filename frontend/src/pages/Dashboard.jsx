import { useState, useEffect } from 'react';
import { dashboardAPI, orderAPI } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        dashboardAPI.getStats(),
        orderAPI.getAll(),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Products',
      value: stats?.total_products || 0,
      icon: '📦',
      accent: '#6c63ff',
      bg: 'rgba(108, 99, 255, 0.12)',
    },
    {
      label: 'Total Customers',
      value: stats?.total_customers || 0,
      icon: '👥',
      accent: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.12)',
    },
    {
      label: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: '🛒',
      accent: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.12)',
    },
    {
      label: 'Total Revenue',
      value: `₹${(stats?.total_revenue || 0).toLocaleString('en-IN')}`,
      icon: '💰',
      accent: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.12)',
    },
    {
      label: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: '⏳',
      accent: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      label: 'Low Stock Items',
      value: stats?.low_stock_products || 0,
      icon: '⚠️',
      accent: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your inventory and orders</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="stat-card"
            style={{ '--stat-accent': stat.accent, '--stat-bg': stat.bg }}
          >
            <div className="stat-card-icon">{stat.icon}</div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Orders</h3>
        </div>
        {recentOrders.length > 0 ? (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="font-mono text-sm">#{String(order.id).padStart(4, '0')}</span>
                    </td>
                    <td>{order.customer_name || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>₹{order.total_amount?.toFixed(2)}</td>
                    <td className="text-secondary text-sm">
                      {order.order_date
                        ? new Date(order.order_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-empty">
            <div className="table-empty-icon">🛒</div>
            <p>No orders yet. Create your first order!</p>
          </div>
        )}
      </div>
    </div>
  );
}
