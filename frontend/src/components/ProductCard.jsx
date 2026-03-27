import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from './Toast'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { addToCart, cartLoading } = useCart()
  const toast = useToast()

  const { id, name, slug, cover_image, price, final_price, discount_percent,
          platform, is_digital, avg_rating, review_count, stock } = product

  const imgSrc     = cover_image ? `/covers/${cover_image.split('/').pop()}` : '/assets/placeholder.webp'
  const priceDisp  = Number(final_price || price).toLocaleString()
  const origDisp   = discount_percent > 0 ? Number(price).toLocaleString() : null
  const rating     = Number(avg_rating || 0).toFixed(1)
  const inStock    = is_digital || stock > 0

  const handleAdd = async (e) => {
    e.preventDefault(); e.stopPropagation()
    try {
      await addToCart(id, 1)
      toast.success(`${name} added to cart!`)
    } catch (err) {
      toast.error(err.message || 'Could not add to cart.')
    }
  }

  return (
    <Link to={`/product/${slug}`} className="product-card" tabIndex={0}>
      {/* Image */}
      <div className="pc-image">
        <img src={imgSrc} alt={name} loading="lazy" />
        <div className="pc-overlay">
          <button className="pc-quick-add btn btn-primary btn-sm" onClick={handleAdd} disabled={!inStock || cartLoading}>
            {inStock ? '+ Add to Cart' : 'Out of Stock'}
          </button>
        </div>
        {discount_percent > 0 && (
          <span className="pc-discount-badge">-{discount_percent}%</span>
        )}
        {is_digital && <span className="pc-digital-badge">Digital</span>}
      </div>

      {/* Info */}
      <div className="pc-info">
        <p className="pc-platform">{platform}</p>
        <h3 className="pc-name">{name}</h3>

        {/* Stars */}
        {Number(review_count) > 0 && (
          <div className="pc-rating">
            <Stars value={Number(rating)} />
            <span className="pc-rating-count">({review_count})</span>
          </div>
        )}

        {/* Price */}
        <div className="pc-price">
          <span className="pc-price-final">Ar {priceDisp}</span>
          {origDisp && <span className="pc-price-orig">Ar {origDisp}</span>}
        </div>
      </div>
    </Link>
  )
}

function Stars({ value }) {
  return (
    <div className="stars" aria-label={`${value} out of 5`}>
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${n <= Math.round(value) ? 'star--filled' : ''}`}>★</span>
      ))}
    </div>
  )
}

export { Stars }
