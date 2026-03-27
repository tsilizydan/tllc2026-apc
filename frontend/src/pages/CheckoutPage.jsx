import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderService, paymentService } from '../services/api'
import { useToast } from '../components/Toast'
import './CheckoutPage.css'

const STEPS = ['Account', 'Delivery', 'Payment', 'Confirmation']
const PAYMENT_METHODS = [
  { id: 'mvola',        label: 'Mvola',        icon: '📱', desc: 'Pay via Telma Mvola' },
  { id: 'orange_money', label: 'Orange Money', icon: '🟠', desc: 'Pay via Orange Money' },
  { id: 'airtel_money', label: 'Airtel Money', icon: '🔴', desc: 'Pay via Airtel Money' },
  { id: 'cod',          label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive' },
]

export default function CheckoutPage() {
  const { cart, clearCart }  = useCart()
  const { user, login, register } = useAuth()
  const navigate             = useNavigate()
  const toast                = useToast()

  const [step, setStep]     = useState(user ? 1 : 0)
  const [loading, setLoad]  = useState(false)
  const [confirmedOrder, setConfirmed] = useState(null)
  const [payInstructions, setPayInstr] = useState(null)

  // Form state
  const [authForm, setAuthForm] = useState({ mode: 'login', name: '', email: '', password: '' })
  const [delivery, setDelivery] = useState({ full_name: user?.name||'', phone: '', address: '', city: '', region: '', notes: '' })
  const [payMethod, setPayMethod] = useState('mvola')

  const shipping = cart.subtotal >= 100000 ? 0 : 5000
  const total    = cart.subtotal + shipping

  // Step 0 — Auth
  const handleAuth = async () => {
    setLoad(true)
    try {
      if (authForm.mode === 'login') {
        await login(authForm.email, authForm.password)
      } else {
        await register(authForm.name, authForm.email, authForm.password)
      }
      toast.success('Welcome!')
      setStep(1)
    } catch (e) { toast.error(e.message) }
    finally { setLoad(false) }
  }

  // Step 1 → 2
  const handleDelivery = () => {
    const req = ['full_name','phone','address','city']
    for (const f of req) { if (!delivery[f]) { toast.error(`${f.replace('_',' ')} is required.`); return } }
    setStep(2)
  }

  // Step 2 → 3: place order + initiate payment
  const handleOrder = async () => {
    setLoad(true)
    try {
      const orderRes = await orderService.create({ ...delivery, payment_method: payMethod })
      const { order_number, total: oTotal } = orderRes.data
      const payRes = await paymentService.initiate(order_number, payMethod)
      setConfirmed({ order_number, total: oTotal })
      setPayInstr(payRes.data)
      await clearCart()
      setStep(3)
    } catch (e) { toast.error(e.message || 'Could not place order.') }
    finally { setLoad(false) }
  }

  if (cart.items.length === 0 && step < 3) {
    return (
      <div className="page-wrapper text-center" style={{paddingTop:80}}>
        <h2>Your cart is empty.</h2>
        <Link to="/shop" className="btn btn-primary" style={{marginTop:24}}>Browse Shop</Link>
      </div>
    )
  }

  return (
    <div className="page-wrapper checkout-page">
      <div className="container">
        {/* Step indicator */}
        <div className="checkout-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`checkout-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
              <div className="step-num">{i < step ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">

            {/* ── STEP 0: Auth ──────────────────────── */}
            {step === 0 && (
              <div className="checkout-card animate-fadeIn">
                <h2>Step 1: Account</h2>
                <div className="auth-toggle">
                  <button className={authForm.mode === 'login' ? 'active' : ''} onClick={() => setAuthForm(f => ({...f, mode:'login'}))}>Sign In</button>
                  <button className={authForm.mode === 'register' ? 'active' : ''} onClick={() => setAuthForm(f => ({...f, mode:'register'}))}>Create Account</button>
                </div>
                {authForm.mode === 'register' && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={authForm.name} onChange={e => setAuthForm(f => ({...f, name: e.target.value}))} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={authForm.email} onChange={e => setAuthForm(f => ({...f, email: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" value={authForm.password} onChange={e => setAuthForm(f => ({...f, password: e.target.value}))} />
                </div>
                <button className="btn btn-primary btn-full btn-lg" onClick={handleAuth} disabled={loading} style={{marginTop:24}}>
                  {loading ? 'Please wait...' : authForm.mode === 'login' ? 'Sign In & Continue' : 'Create Account & Continue'}
                </button>
              </div>
            )}

            {/* ── STEP 1: Delivery ────────────────── */}
            {step === 1 && (
              <div className="checkout-card animate-fadeIn">
                <h2>Step 2: Delivery Information</h2>
                <div className="form-grid">
                  {[
                    { key:'full_name', label:'Full Name', type:'text' },
                    { key:'phone',     label:'Phone Number', type:'tel' },
                    { key:'address',   label:'Street Address', type:'text' },
                    { key:'city',      label:'City', type:'text' },
                    { key:'region',    label:'Region / Province (optional)', type:'text' },
                    { key:'notes',     label:'Order Notes (optional)', type:'text' },
                  ].map(field => (
                    <div key={field.key} className={`form-group${field.key === 'address' || field.key === 'notes' ? ' full' : ''}`}>
                      <label className="form-label">{field.label}</label>
                      <input type={field.type} className="form-input" value={delivery[field.key]}
                             onChange={e => setDelivery(d => ({...d, [field.key]: e.target.value}))} />
                    </div>
                  ))}
                </div>
                <div className="step-nav">
                  <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handleDelivery}>Continue to Payment →</button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Payment ─────────────────── */}
            {step === 2 && (
              <div className="checkout-card animate-fadeIn">
                <h2>Step 3: Payment Method</h2>
                <div className="payment-methods">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} className={`payment-method${payMethod === m.id ? ' selected' : ''}`}
                            onClick={() => setPayMethod(m.id)}>
                      <span className="pm-icon">{m.icon}</span>
                      <div><strong>{m.label}</strong><p>{m.desc}</p></div>
                      <div className="pm-radio">{payMethod === m.id && '●'}</div>
                    </button>
                  ))}
                </div>
                <div className="step-nav">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary btn-lg" onClick={handleOrder} disabled={loading}>
                    {loading ? 'Placing order...' : `Place Order — Ar ${total.toLocaleString()}`}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirmation ────────────── */}
            {step === 3 && confirmedOrder && (
              <div className="checkout-card confirmation animate-scaleIn">
                <div className="conf-icon">🎉</div>
                <h2>Order Confirmed!</h2>
                <p>Your order <strong>#{confirmedOrder.order_number}</strong> has been placed.</p>
                {payInstructions && payInstructions.instructions && (
                  <div className="payment-instructions">
                    <h4>Payment Instructions</h4>
                    <p>{payInstructions.instructions}</p>
                  </div>
                )}
                <div className="conf-actions">
                  <Link to="/dashboard" className="btn btn-primary">View My Orders</Link>
                  <Link to="/shop" className="btn btn-ghost">Continue Shopping</Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary sidebar */}
          {step < 3 && (
            <aside className="checkout-summary">
              <h3>Your Order</h3>
              {cart.items.map(item => (
                <div key={item.id} className="cs-item">
                  <img src={`/covers/${item.cover_image?.split('/').pop() || 'placeholder.webp'}`} alt={item.name} />
                  <div className="cs-info">
                    <span>{item.name}</span>
                    <strong>× {item.quantity}</strong>
                  </div>
                  <strong>Ar {Number(item.line_total).toLocaleString()}</strong>
                </div>
              ))}
              <div className="divider"/>
              <div className="summary-row"><span>Subtotal</span><span>Ar {Number(cart.subtotal).toLocaleString()}</span></div>
              <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `Ar ${shipping.toLocaleString()}`}</span></div>
              <div className="divider"/>
              <div className="summary-row summary-total"><span>Total</span><span>Ar {total.toLocaleString()}</span></div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
