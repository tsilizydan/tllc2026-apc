import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../components/Toast'
import './CartPage.css'

export default function CartPage() {
  const { cart, updateItem, removeItem, clearCart } = useCart()
  const navigate = useNavigate()
  const toast    = useToast()

  const handleRemove = async (cartId, name) => {
    await removeItem(cartId)
    toast.info(`${name} removed from cart.`)
  }

  const shipping = cart.subtotal >= 100000 ? 0 : 5000
  const total    = cart.subtotal + shipping

  if (cart.items.length === 0) return (
    <div className="page-wrapper">
      <div className="container text-center" style={{paddingTop: 80}}>
        <div style={{fontSize: '5rem', marginBottom: 24}}>🛒</div>
        <h2 className="section-title" style={{justifyContent:'center', marginBottom: 16}}>Your cart is empty</h2>
        <p style={{color:'var(--text-muted)', marginBottom: 32}}>Time to fill it with amazing games!</p>
        <Link to="/shop" className="btn btn-primary btn-lg">Browse Shop</Link>
      </div>
    </div>
  )

  return (
    <div className="page-wrapper cart-page">
      <div className="container">
        <h1 className="section-title" style={{marginBottom: 40}}>Shopping Cart <span style={{color:'var(--text-muted)', fontSize:'1rem'}}>({cart.count} items)</span></h1>
        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            {cart.items.map(item => (
              <div key={item.id} className="cart-item">
                <Link to={`/product/${item.id}`} className="ci-image">
                  <img src={`/covers/${item.cover_image?.split('/').pop() || 'placeholder.webp'}`} alt={item.name} />
                </Link>
                <div className="ci-info">
                  <p className="ci-platform">{item.platform}</p>
                  <h3 className="ci-name">{item.name}</h3>
                  <div className="ci-price">Ar {Number(item.final_price).toLocaleString()}</div>
                </div>
                <div className="ci-actions">
                  {!item.is_digital && (
                    <div className="qty-control">
                      <button onClick={() => updateItem(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateItem(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</button>
                    </div>
                  )}
                  <div className="ci-subtotal">Ar {Number(item.line_total).toLocaleString()}</div>
                  <button className="ci-remove" onClick={() => handleRemove(item.id, item.name)}>🗑</button>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={clearCart} style={{marginTop: 16}}>Clear Cart</button>
          </div>

          {/* Summary */}
          <aside className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>Ar {Number(cart.subtotal).toLocaleString()}</span></div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span style={{color:'var(--success)'}}>FREE</span> : `Ar ${shipping.toLocaleString()}`}</span>
            </div>
            {shipping > 0 && (
              <p className="summary-note">Free shipping on orders over Ar {(100000).toLocaleString()}. Add Ar {(100000-cart.subtotal).toLocaleString()} more.</p>
            )}
            <div className="divider"/>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>Ar {total.toLocaleString()}</span>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/checkout')} style={{marginTop: 24}}>
              Proceed to Checkout →
            </button>
            <Link to="/shop" className="btn btn-ghost btn-full" style={{marginTop: 12}}>Continue Shopping</Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
