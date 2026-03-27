import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { orderService } from '../services/api'
import { useToast } from '../components/Toast'
import './DashboardPage.css'

const ORDER_STATUSES = {
  pending: { label: 'Pending', class: 'badge-gold' },
  paid:    { label: 'Paid',    class: 'badge-blue' },
  processing: { label: 'Processing', class: 'badge-blue' },
  shipped:    { label: 'Shipped',    class: 'badge-purple' },
  delivered:  { label: 'Delivered',  class: 'badge-green' },
  cancelled:  { label: 'Cancelled',  class: 'badge-red' },
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const toast            = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoad]  = useState(true)
  const [tab, setTab]       = useState('orders')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    orderService.list()
      .then(r => setOrders(r.data || []))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/')
    toast.info('You have been signed out.')
  }

  return (
    <div className="page-wrapper dashboard-page">
      <div className="container dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dash-user">
            <div className="dash-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <nav className="dash-nav">
            {[
              { key:'orders',  label:'My Orders',  icon:'📦' },
              { key:'profile', label:'Profile',     icon:'👤' },
            ].map(item => (
              <button key={item.key}
                      className={`dash-nav-item${tab === item.key ? ' active' : ''}`}
                      onClick={() => setTab(item.key)}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
            <button className="dash-nav-item dash-nav-item--danger" onClick={handleLogout}>
              <span>🚪</span>Sign Out
            </button>
          </nav>
        </aside>

        {/* Main */}
        <main className="dashboard-main">
          {tab === 'orders' && (
            <div className="animate-fadeIn">
              <h2 className="section-title" style={{marginBottom: 32}}>My Orders</h2>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{height: 80, borderRadius: 12, marginBottom: 12}} />
                ))
              ) : orders.length === 0 ? (
                <div className="dash-empty">
                  <div>📦</div>
                  <h3>No orders yet</h3>
                  <p>Your orders will appear here.</p>
                  <Link to="/shop" className="btn btn-primary">Browse Shop</Link>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(o => {
                    const s = ORDER_STATUSES[o.status] || { label: o.status, class: 'badge-blue' }
                    return (
                      <div key={o.id} className="order-row">
                        <div className="order-row-info">
                          <strong>#{o.order_number}</strong>
                          <span>{new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`badge ${s.class}`}>{s.label}</span>
                        <strong>Ar {Number(o.total).toLocaleString()}</strong>
                        <Link to={`/order/${o.id}`} className="btn btn-ghost btn-sm">Details</Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div className="animate-fadeIn">
              <h2 className="section-title" style={{marginBottom: 32}}>Profile</h2>
              <div className="profile-card">
                <div className="profile-avatar-lg">{user?.name?.[0]?.toUpperCase()}</div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" defaultValue={user?.name} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" defaultValue={user?.email} readOnly />
                </div>
                <p style={{color:'var(--text-muted)', fontSize:'0.82rem', marginTop: 16}}>Profile editing coming soon.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
