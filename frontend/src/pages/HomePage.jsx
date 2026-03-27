import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { productService, categoryService } from '../services/api'
import './HomePage.css'

export default function HomePage() {
  const [featured, setFeatured]     = useState([])
  const [newReleases, setNew]       = useState([])
  const [deals, setDeals]           = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      productService.featured(8),
      productService.list({ sort: 'newest',   per_page: 8 }),
      productService.list({ sort: 'discount', per_page: 8 }),
      categoryService.list(),
    ]).then(([feat, newest, disc, cats]) => {
      setFeatured(feat.data || [])
      setNew(newest.data?.products || [])
      setDeals(disc.data?.products || [])
      setCategories(cats.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-wrapper home-page">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__glow hero__glow--blue" />
          <div className="hero__glow hero__glow--purple" />
          <div className="hero__grid" />
        </div>
        <div className="container hero__content">
          <div className="hero__text animate-slideUp">
            <span className="hero__eyebrow">Welcome to the next level</span>
            <h1>Your <span className="text-gradient">Ultimate Gaming</span> Universe</h1>
            <p>Discover thousands of games, accessories, and gift cards. Fast delivery across Madagascar.</p>
            <div className="hero__ctas">
              <Link to="/shop" className="btn btn-primary btn-lg">Browse Shop</Link>
              <Link to="/shop?category=gift-cards" className="btn btn-ghost btn-lg">Gift Cards</Link>
            </div>
          </div>
          <div className="hero__visual animate-fadeIn">
            <div className="hero__card-stack">
              {featured.slice(0, 3).map((p, i) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="hero__mini-card"
                      style={{ '--delay': `${i * 100}ms`, '--z': 3 - i }}>
                  <img src={`/covers/${p.cover_image?.split('/').pop() || 'placeholder.webp'}`} alt={p.name} />
                  <div className="hero__mini-info">
                    <span>{p.name}</span>
                    <strong>Ar {Number(p.final_price).toLocaleString()}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="hero__stats">
          <div className="container">
            <div className="stats-row">
              <div className="stat"><strong>1,000+</strong><span>Games available</span></div>
              <div className="stat"><strong>24h</strong><span>Digital delivery</span></div>
              <div className="stat"><strong>All MG</strong><span>Nationwide delivery</span></div>
              <div className="stat"><strong>100%</strong><span>Secure payments</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
          </div>
          <div className="category-grid">
            {loading
              ? Array(6).fill(0).map((_, i) => <div key={i} className="cat-card skeleton" style={{height:160}}/>)
              : categories.map(cat => (
                <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="cat-card">
                  <div className="cat-card__bg"
                    style={{ backgroundImage: `url(${cat.image || '/assets/cat_pc.webp'})` }} />
                  <div className="cat-card__overlay">
                    <h3>{cat.name}</h3>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      </section>

      {/* ── Featured ──────────────────────────────── */}
      <ProductSection title="Featured Games" products={featured} loading={loading} link="/shop?featured=1" linkLabel="View All" />

      {/* ── New Releases ──────────────────────────── */}
      <ProductSection title="New Releases" products={newReleases} loading={loading} link="/shop?sort=newest" linkLabel="See More" dark />

      {/* ── Top Deals ────────────────────────────── */}
      <ProductSection title="🔥 Top Deals" products={deals} loading={loading} link="/shop?sort=discount" linkLabel="All Deals" />

      {/* ── Trust Banner ─────────────────────────── */}
      <section className="section trust-section">
        <div className="container">
          <div className="trust-grid">
            {[
              { icon: '⚡', title: 'Instant Digital Delivery', desc: 'Get codes & downloads in minutes after payment.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Mvola, Orange Money, Airtel & COD accepted.' },
              { icon: '⭐', title: 'Quality Guaranteed', desc: '100% authentic games from trusted publishers.' },
              { icon: '🎮', title: 'Gamer Support', desc: 'Expert help Mon–Sat, 8am–8pm.' },
            ].map(t => (
              <div key={t.title} className="trust-item">
                <div className="trust-icon">{t.icon}</div>
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function ProductSection({ title, products, loading, link, linkLabel, dark }) {
  const skeletons = Array(8).fill(0)
  return (
    <section className={`section${dark ? ' section--dark' : ''}`}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          {link && <Link to={link} className="btn btn-ghost btn-sm">{linkLabel} →</Link>}
        </div>
        <div className="product-grid">
          {loading
            ? skeletons.map((_, i) => <ProductSkeleton key={i} />)
            : products.map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </div>
    </section>
  )
}

function ProductSkeleton() {
  return (
    <div className="card">
      <div className="skeleton" style={{ aspectRatio: '3/4' }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 12, width: '50%' }} />
        <div className="skeleton" style={{ height: 16, width: '90%' }} />
        <div className="skeleton" style={{ height: 20, width: '40%', marginTop: 8 }} />
      </div>
    </div>
  )
}
