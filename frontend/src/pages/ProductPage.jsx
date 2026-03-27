import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { productService, reviewService } from '../services/api'
import { useCart } from '../context/CartContext'
import { useToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'
import { Stars } from '../components/ProductCard'
import './ProductPage.css'

export default function ProductPage() {
  const { slug }             = useParams()
  const navigate             = useNavigate()
  const { addToCart }        = useCart()
  const toast                = useToast()

  const [product, setProduct]   = useState(null)
  const [related, setRelated]   = useState([])
  const [reviews, setReviews]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [imageIdx, setImageIdx] = useState(0)
  const [tab, setTab]           = useState('description')
  const [qty, setQty]           = useState(1)
  const [adding, setAdding]     = useState(false)

  useEffect(() => {
    setLoading(true)
    setImageIdx(0)
    productService.single(slug)
      .then(async r => {
        const p = r.data
        setProduct(p)
        const [rel, rev] = await Promise.all([
          productService.related(p.id, p.category_id).catch(() => ({ data: [] })),
          reviewService.list(p.id),
        ])
        setRelated(rel.data || [])
        setReviews(rev.data.reviews || [])
      })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleAdd = async () => {
    setAdding(true)
    try {
      await addToCart(product.id, qty)
      toast.success(`${product.name} added to cart!`)
    } catch (e) { toast.error(e.message) }
    finally { setAdding(false) }
  }

  const handleBuyNow = async () => {
    await handleAdd()
    navigate('/cart')
  }

  if (loading) return (
    <div className="page-wrapper"><div className="container" style={{paddingTop: 60}}>
      <div className="product-page-skeleton">
        <div className="skeleton" style={{aspectRatio:'1', borderRadius: 16}}/>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="skeleton" style={{height:14, width:'30%'}}/>
          <div className="skeleton" style={{height:36, width:'85%'}}/>
          <div className="skeleton" style={{height:36, width:'60%'}}/>
          <div className="skeleton" style={{height:20, width:'40%'}}/>
          <div className="skeleton" style={{height:52, marginTop:24}}/>
        </div>
      </div>
    </div></div>
  )

  if (!product) return null

  const images = [{ image_url: product.cover_image }, ...(product.gallery || [])]
  const imgSrc = (url) => url ? `/covers/${url.split('/').pop()}` : '/assets/placeholder.webp'
  const inStock = product.is_digital || product.stock > 0
  const maxQty  = product.is_digital ? 1 : Math.min(product.stock, 10)

  return (
    <div className="page-wrapper product-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${product.category_slug}`}>{product.category_name}</Link> / <span>{product.name}</span>
        </nav>

        {/* Main layout */}
        <div className="pp-layout">
          {/* Gallery */}
          <div className="pp-gallery">
            <div className="pp-main-img">
              <img src={imgSrc(images[imageIdx]?.image_url)} alt={product.name} />
            </div>
            {images.length > 1 && (
              <div className="pp-thumbnails">
                {images.map((img, i) => (
                  <button key={i} className={`pp-thumb${i === imageIdx ? ' active' : ''}`}
                          onClick={() => setImageIdx(i)}>
                    <img src={imgSrc(img.image_url)} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pp-info">
            <div className="pp-meta">
              <span className="badge badge-blue">{product.platform}</span>
              {product.is_digital && <span className="badge badge-purple">Digital</span>}
              {!inStock && <span className="badge badge-red">Out of Stock</span>}
            </div>
            <h1 className="pp-title">{product.name}</h1>

            {/* Rating */}
            {Number(product.review_count) > 0 && (
              <div className="pp-rating">
                <Stars value={Number(product.avg_rating)} />
                <span>{Number(product.avg_rating).toFixed(1)} / 5</span>
                <span className="text-muted">({product.review_count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="pp-price">
              <span className="pp-price-final">Ar {Number(product.final_price).toLocaleString()}</span>
              {product.discount_percent > 0 && (
                <>
                  <span className="pp-price-orig">Ar {Number(product.price).toLocaleString()}</span>
                  <span className="badge badge-red">-{product.discount_percent}%</span>
                </>
              )}
            </div>

            <p className="pp-short-desc">{product.short_description}</p>

            {/* Quantity */}
            {!product.is_digital && inStock && (
              <div className="pp-qty">
                <label>Quantity</label>
                <div className="qty-control">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(maxQty, q + 1))}>+</button>
                </div>
                <span className="text-muted" style={{fontSize:'0.82rem'}}>{product.stock} in stock</span>
              </div>
            )}

            {/* CTAs */}
            <div className="pp-ctas">
              <button className="btn btn-primary btn-lg" onClick={handleAdd} disabled={!inStock || adding}>
                {adding ? 'Adding...' : '🛒 Add to Cart'}
              </button>
              <button className="btn btn-secondary btn-lg" onClick={handleBuyNow} disabled={!inStock || adding}>
                ⚡ Buy Now
              </button>
            </div>

            {/* Details */}
            <div className="pp-details-grid">
              {product.publisher    && <div><span>Publisher</span><strong>{product.publisher}</strong></div>}
              {product.developer    && <div><span>Developer</span><strong>{product.developer}</strong></div>}
              {product.release_date && <div><span>Release</span><strong>{new Date(product.release_date).getFullYear()}</strong></div>}
              {product.age_rating   && <div><span>Rating</span><strong>{product.age_rating}</strong></div>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pp-tabs">
          <div className="tab-bar">
            {['description','reviews'].map(t => (
              <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t === 'description' ? 'Description' : `Reviews (${reviews.length})`}
              </button>
            ))}
          </div>
          <div className="tab-content">
            {tab === 'description' ? (
              <div className="pp-description" dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }} />
            ) : (
              <div className="pp-reviews">
                {reviews.length === 0 ? (
                  <p className="text-muted">No reviews yet. Be the first to review!</p>
                ) : reviews.map(r => (
                  <div key={r.id} className="review-card">
                    <div className="review-header">
                      <div className="review-avatar">{r.user_name?.[0]?.toUpperCase()}</div>
                      <div>
                        <strong>{r.user_name}</strong>
                        <Stars value={r.rating} />
                      </div>
                      {r.is_verified && <span className="badge badge-green">Verified</span>}
                      <span className="text-muted" style={{marginLeft:'auto', fontSize:'0.8rem'}}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.title && <h4 className="review-title">{r.title}</h4>}
                    {r.body  && <p className="review-body">{r.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">You May Also Like</h2>
            </div>
            <div className="product-grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
