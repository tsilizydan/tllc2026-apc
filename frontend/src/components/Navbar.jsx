import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { productService } from '../services/api'
import './Navbar.css'

export default function Navbar() {
  const { cart }         = useCart()
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()

  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [userOpen, setUserOpen]   = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [searchRes, setSearchRes] = useState([])
  const [searching, setSearching] = useState(false)
  const searchTimeout             = useRef(null)
  const userRef                   = useRef(null)

  /* Close drawer whenever route changes */
  useEffect(() => { setMenuOpen(false); setUserOpen(false) }, [location.pathname])

  /* Sticky nav shadow on scroll */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  /* Lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  /* Close user dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* Debounced search */
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    if (searchVal.length < 2) { setSearchRes([]); return }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await productService.search(searchVal)
        setSearchRes(res.data || [])
      } catch { /* silent */ } finally { setSearching(false) }
    }, 350)
  }, [searchVal])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const goProduct = (slug) => {
    setSearchVal(''); setSearchRes([])
    navigate(`/product/${slug}`)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal(''); setSearchRes([])
    }
  }

  const clearSearch = () => { setSearchVal(''); setSearchRes([]) }

  /* Shared search box markup (reused in desktop + mobile drawer) */
  const SearchBox = ({ inputId = 'nav-search' }) => (
    <div className="search-box">
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        id={inputId}
        type="text"
        placeholder="Search games, accessories…"
        value={searchVal}
        onChange={e => setSearchVal(e.target.value)}
        onKeyDown={handleSearchKeyDown}
        autoComplete="off"
      />
      {searchVal && <button className="search-clear" onClick={clearSearch} aria-label="Clear">✕</button>}
    </div>
  )

  return (
    <>
      {/* Mobile overlay / backdrop */}
      <div
        className={`nav-backdrop${menuOpen ? ' visible' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar__inner">

          {/* Logo */}
          <Link to="/" className="navbar__logo">
            <span className="logo__apos">APOS</span>
            <span className="logo__apostrophe">'</span>
            <span className="logo__creed">CREED</span>
          </Link>

          {/* Desktop Search */}
          <div className="navbar__search">
            <SearchBox inputId="nav-search-desktop" />
            {searchRes.length > 0 && (
              <div className="search-dropdown">
                {searchRes.map(p => (
                  <button key={p.id} className="search-result" onClick={() => goProduct(p.slug)}>
                    <img
                      src={`/covers/${p.cover_image?.split('/').pop() || 'placeholder.webp'}`}
                      alt={p.name}
                    />
                    <div>
                      <span className="sr-name">{p.name}</span>
                      <span className="sr-price">Ar {Number(p.final_price).toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav Links + Mobile Search inside drawer */}
          <div className={`navbar__links${menuOpen ? ' open' : ''}`}>
            {/* Mobile-only search inside drawer */}
            <div className="mobile-search-row">
              <SearchBox inputId="nav-search-mobile" />
              {searchRes.length > 0 && (
                <div className="search-dropdown" style={{ position: 'static', marginTop: 8 }}>
                  {searchRes.map(p => (
                    <button key={p.id} className="search-result" onClick={() => goProduct(p.slug)}>
                      <img
                        src={`/covers/${p.cover_image?.split('/').pop() || 'placeholder.webp'}`}
                        alt={p.name}
                      />
                      <div>
                        <span className="sr-name">{p.name}</span>
                        <span className="sr-price">Ar {Number(p.final_price).toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link to="/shop"                         className="nav-link">Shop</Link>
            <Link to="/shop?category=pc-games"       className="nav-link">PC</Link>
            <Link to="/shop?category=playstation"    className="nav-link">PlayStation</Link>
            <Link to="/shop?category=accessories"    className="nav-link">Accessories</Link>
          </div>

          {/* Actions */}
          <div className="navbar__actions">
            {/* Cart */}
            <Link to="/cart" className="action-btn cart-btn" aria-label="Cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cart.count > 0 && <span className="cart-badge">{cart.count}</span>}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="user-menu" ref={userRef}>
                <button className="user-btn" onClick={() => setUserOpen(!userOpen)} aria-expanded={userOpen}>
                  <div className="user-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"
                       style={{ transition: 'transform var(--t-fast)', transform: userOpen ? 'rotate(180deg)' : '' }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {userOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <div className="dropdown-divider"/>
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setUserOpen(false)}>My Orders</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="dropdown-item dropdown-item--admin" onClick={() => setUserOpen(false)}>Admin Panel</Link>
                    )}
                    <div className="dropdown-divider"/>
                    <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            )}

            {/* Hamburger */}
            <button
              className={`hamburger${menuOpen ? ' is-open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span/>
              <span/>
              <span/>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
