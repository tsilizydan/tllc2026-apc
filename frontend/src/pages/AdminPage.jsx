import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminService } from '../services/api'
import { useToast } from '../components/Toast'
import './AdminPage.css'

const SECTIONS = ['dashboard', 'products', 'categories', 'orders', 'settings']

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const toast    = useToast()
  const [params, setParams] = useSearchParams()
  const section  = params.get('section') || 'dashboard'
  const setSection = (s) => setParams({ section: s })

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast.error('Admin access required.')
      navigate('/')
    }
  }, [user, authLoading])

  if (authLoading || !user) return null

  return (
    <div className="page-wrapper admin-page">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span>⚙️ Admin</span>
            <Link to="/" style={{fontSize:'0.78rem', color:'var(--text-muted)'}}>← View Site</Link>
          </div>
          <nav className="admin-nav">
            {SECTIONS.map(s => (
              <button key={s} className={`admin-nav-item${section === s ? ' active' : ''}`} onClick={() => setSection(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="admin-main">
          {section === 'dashboard' && <AdminDashboard />}
          {section === 'products'  && <AdminProducts toast={toast} />}
          {section === 'orders'    && <AdminOrders toast={toast} />}
          {section === 'settings'  && <AdminSettings toast={toast} />}
          {section === 'categories' && <AdminCategories toast={toast} />}
        </main>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────
function AdminDashboard() {
  const [data, setData] = useState(null)
  useEffect(() => { adminService.dashboard().then(r => setData(r.data)).catch(() => {}) }, [])
  if (!data) return <div className="admin-loading">Loading...</div>

  return (
    <div className="animate-fadeIn">
      <h2 className="admin-title">Dashboard</h2>
      <div className="stat-cards">
        <StatCard title="Total Revenue" value={`Ar ${Number(data.revenue).toLocaleString()}`} icon="💰" color="blue" />
        <StatCard title="Today's Revenue" value={`Ar ${Number(data.today_revenue).toLocaleString()}`} icon="📈" color="purple" />
        <StatCard title="Total Orders" value={data.total_orders} icon="📦" color="blue" />
        <StatCard title="Products" value={data.product_count} icon="🎮" color="green" />
        <StatCard title="Customers" value={data.customer_count} icon="👤" color="purple" />
        <StatCard title="Low Stock" value={data.low_stock_count} icon="⚠️" color="red" />
      </div>
      <h3 className="admin-subtitle">Recent Orders</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
          <tbody>
            {data.recent_orders?.map(o => (
              <tr key={o.id}>
                <td>#{o.order_number}</td>
                <td>{o.customer}</td>
                <td><span className="badge badge-blue">{o.status}</span></td>
                <td>Ar {Number(o.total).toLocaleString()}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-title">{title}</div>
      </div>
    </div>
  )
}

// ── Products ──────────────────────────────────────
function AdminProducts({ toast }) {
  const [prods, setProds] = useState([])
  const [loading, setLoad] = useState(true)
  const [page, setPage]    = useState(1)
  const [total, setTotal]  = useState(0)

  const fetchProds = (pg = 1) => {
    setLoad(true)
    adminService.listProducts({ page: pg, per_page: 20 })
      .then(r => { setProds(r.data.products || []); setTotal(r.data.total || 0) })
      .finally(() => setLoad(false))
  }

  useEffect(() => fetchProds(), [])

  const toggleActive = async (prod) => {
    try {
      await adminService.updateProduct({ id: prod.id, is_active: prod.is_active ? 0 : 1 })
      toast.success('Product updated.')
      fetchProds(page)
    } catch (e) { toast.error(e.message) }
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('Deactivate this product?')) return
    try { await adminService.deleteProduct(id); toast.success('Product deactivated.'); fetchProds(page) }
    catch (e) { toast.error(e.message) }
  }

  return (
    <div className="animate-fadeIn">
      <div className="admin-header">
        <h2 className="admin-title">Products <span>({total})</span></h2>
      </div>
      {loading ? <div className="admin-loading">Loading...</div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {prods.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="prod-cell">
                      <img src={`/covers/${p.cover_image?.split('/').pop() || 'placeholder.webp'}`} alt={p.name} />
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.category_name}</td>
                  <td>Ar {Number(p.final_price).toLocaleString()}</td>
                  <td>{p.stock}</td>
                  <td><span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(p)}>{p.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Orders ────────────────────────────────────────
function AdminOrders({ toast }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoad]  = useState(true)

  const fetchOrders = () => {
    adminService.listOrders({}).then(r => setOrders(r.data.orders || [])).finally(() => setLoad(false))
  }
  useEffect(fetchOrders, [])

  const updateStatus = async (id, status) => {
    try { await adminService.updateOrderStatus(id, status); toast.success('Status updated.'); fetchOrders() }
    catch (e) { toast.error(e.message) }
  }

  return (
    <div className="animate-fadeIn">
      <h2 className="admin-title">Orders</h2>
      {loading ? <div className="admin-loading">Loading...</div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Order #</th><th>Customer</th><th>Payment</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>#{o.order_number}</td>
                  <td>{o.customer}</td>
                  <td>{o.payment_method}</td>
                  <td>Ar {Number(o.total).toLocaleString()}</td>
                  <td><span className="badge badge-blue">{o.status}</span></td>
                  <td>
                    <select className="form-input form-select" style={{padding:'6px 10px', fontSize:'0.82rem'}}
                            value={o.status}
                            onChange={e => updateStatus(o.id, e.target.value)}>
                      {['pending','paid','processing','shipped','delivered','cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Categories ─────────────────────────────────────
function AdminCategories({ toast }) {
  const [cats, setCats]   = useState([])
  const [form, setForm]   = useState({ name:'', description:'', image:'' })
  const [saving, setSave] = useState(false)
  useEffect(() => { adminService.listCategories().then(r => setCats(r.data || [])) }, [])

  const handleCreate = async (e) => {
    e.preventDefault(); if (!form.name) { toast.error('Name required.'); return }
    setSave(true)
    try { await adminService.createCategory(form); toast.success('Category created.'); setForm({name:'',description:'',image:''}); adminService.listCategories().then(r => setCats(r.data || [])) }
    catch (e) { toast.error(e.message) } finally { setSave(false) }
  }

  return (
    <div className="animate-fadeIn">
      <h2 className="admin-title">Categories</h2>
      <div className="admin-table-wrap" style={{marginBottom: 32}}>
        <table className="admin-table"><thead><tr><th>Name</th><th>Slug</th><th>Status</th></tr></thead>
          <tbody>{cats.map(c => (<tr key={c.id}><td>{c.name}</td><td>{c.slug}</td><td><span className={`badge ${c.is_active ? 'badge-green':'badge-red'}`}>{c.is_active?'Active':'Inactive'}</span></td></tr>))}</tbody>
        </table>
      </div>
      <h3 className="admin-subtitle">Add Category</h3>
      <form onSubmit={handleCreate} style={{display:'grid',gap:16,maxWidth:480}}>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} /></div>
        <button type="submit" className="btn btn-primary" disabled={saving}>Create Category</button>
      </form>
    </div>
  )
}

// ── Settings ──────────────────────────────────────
function AdminSettings({ toast }) {
  const [settings, setSettings] = useState({})
  const [loading, setLoad]      = useState(true)
  const [saving, setSave]       = useState(false)
  useEffect(() => { adminService.getSettings().then(r => setSettings(r.data || {})).finally(() => setLoad(false)) }, [])

  const handleSave = async () => {
    setSave(true)
    try { await adminService.updateSettings(settings); toast.success('Settings saved.') }
    catch (e) { toast.error(e.message) } finally { setSave(false) }
  }

  const editableKeys = ['site_name','site_tagline','site_email','site_phone','currency','currency_symbol','shipping_cost','free_shipping_threshold','maintenance_mode']

  if (loading) return <div className="admin-loading">Loading...</div>

  return (
    <div className="animate-fadeIn">
      <h2 className="admin-title">Site Settings</h2>
      <div style={{display:'grid',gap:16,maxWidth:560}}>
        {editableKeys.map(k => (
          <div key={k} className="form-group">
            <label className="form-label">{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
            <input className="form-input" value={settings[k] || ''} onChange={e => setSettings(s => ({...s,[k]:e.target.value}))} />
          </div>
        ))}
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{marginTop:8}}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
