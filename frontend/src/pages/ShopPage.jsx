import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { productService, categoryService } from '../services/api'
import './ShopPage.css'

const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo']
const SORTS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'discount',   label: 'Best Deals' },
]

export default function ShopPage() {
  const [params, setParams]     = useSearchParams()
  const [products, setProducts] = useState([])
  const [pagination, setPagi]   = useState({ total: 0, page: 1, pages: 1 })
  const [categories, setCats]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [sidebarOpen, setSidebar] = useState(false)

  // Filters from URL
  const page     = parseInt(params.get('page') || '1')
  const category = params.get('category') || ''
  const platform = params.get('platform') || ''
  const sort     = params.get('sort') || 'newest'
  const search   = params.get('search') || ''

  const setParam = (key, val) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val); else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const setPage = (pg) => {
    const next = new URLSearchParams(params)
    next.set('page', pg)
    setParams(next)
  }

  const [error, setError]       = useState(null)

  useEffect(() => {
    categoryService.list().then(r => setCats(r.data || [])).catch(err => console.error("Category fetch error:", err))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    productService.list({ page, category, platform, sort, search, per_page: 12 })
      .then(r => { 
        setProducts(r.data.products || [])
        setPagi(r.data.pagination || {}) 
      })
      .catch((err) => {
        console.error("Product fetch error:", err)
        setError(err.message || 'Failed to fetch products')
      })
      .finally(() => setLoading(false))
  }, [page, category, platform, sort, search])

  return (
    <div className="page-wrapper shop-page">
      <div className="container shop-layout">
        {/* Sidebar filter */}
        <aside className={`shop-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-head">
            <h3>Filters</h3>
            <button className="sidebar-close" onClick={() => setSidebar(false)}>✕</button>
          </div>

          {/* Categories */}
          <div className="filter-group">
            <h4 className="filter-label">Category</h4>
            <button className={`filter-chip${!category ? ' active' : ''}`} onClick={() => setParam('category', '')}>All</button>
            {categories.map(c => (
              <button key={c.id} className={`filter-chip${category === c.slug ? ' active' : ''}`}
                      onClick={() => setParam('category', c.slug)}>{c.name}</button>
            ))}
          </div>

          {/* Platform */}
          <div className="filter-group">
            <h4 className="filter-label">Platform</h4>
            <button className={`filter-chip${!platform ? ' active' : ''}`} onClick={() => setParam('platform', '')}>All Platforms</button>
            {PLATFORMS.map(p => (
              <button key={p} className={`filter-chip${platform === p ? ' active' : ''}`}
                      onClick={() => setParam('platform', p)}>{p}</button>
            ))}
          </div>

          {/* Reset */}
          <button className="btn btn-ghost btn-sm w-full" style={{marginTop: 24}}
                  onClick={() => setParams({})}>Clear All Filters</button>
        </aside>

        {/* Main content */}
        <main className="shop-main">
          {/* Toolbar */}
          <div className="shop-toolbar">
            <div className="toolbar-left">
              <button className="btn btn-ghost btn-sm filter-toggle" onClick={() => setSidebar(true)}>
                ☰ Filters
              </button>
              {search && <span className="search-tag">"{search}" <button onClick={() => setParam('search', '')} >✕</button></span>}
              {!loading && <span className="result-count">{pagination.total} products</span>}
            </div>
            <select className="form-input form-select sort-select"
                    value={sort} onChange={e => setParam('sort', e.target.value)}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="product-grid">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton" style={{ aspectRatio: '3/4' }} />
                  <div style={{ padding: 16, display:'flex', flexDirection:'column', gap:8 }}>
                    <div className="skeleton" style={{ height: 12, width: '50%' }} />
                    <div className="skeleton" style={{ height: 16 }} />
                    <div className="skeleton" style={{ height: 20, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="shop-empty" style={{ borderColor: 'var(--danger)' }}>
              <div className="empty-icon">⚠️</div>
              <h3 style={{ color: 'var(--danger)' }}>Oops! Something went wrong</h3>
              <p>{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="shop-empty">
              <div className="empty-icon">🎮</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or <button onClick={() => setParams({})}>clear all filters</button></p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(pg => (
                <button key={pg} className={`page-btn${pg === page ? ' active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
              ))}
              <button className="page-btn" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
