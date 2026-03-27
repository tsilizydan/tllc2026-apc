import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import './LoginPage.css'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const toast    = useToast()
  const [mode, setMode]     = useState('login')
  const [loading, setLoad]  = useState(false)
  const [form, setForm]     = useState({ name:'', email:'', password:'' })

  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoad(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        toast.success('Welcome back!')
      } else {
        if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
        await register(form.name, form.email, form.password)
        toast.success('Account created!')
      }
      navigate('/dashboard')
    } catch (err) { toast.error(err.message || 'Authentication failed.') }
    finally { setLoad(false) }
  }

  return (
    <div className="page-wrapper login-page">
      <div className="login-container">
        <div className="login-brand">
          <Link to="/" className="login-logo">
            <span>APOS</span><span style={{color:'var(--accent-blue)'}}>&#39;</span><span style={{color:'var(--accent-purple)'}}>CREED</span>
          </Link>
          <p>Your Ultimate Gaming Universe</p>
        </div>
        <div className="login-card">
          <div className="auth-toggle">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign In</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create Account</button>
          </div>
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Your name" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </div>
            {mode === 'login' && (
              <div style={{textAlign:'right', marginBottom: 8}}>
                <Link to="/forgot-password" style={{fontSize:'0.82rem', color:'var(--text-muted)'}}>Forgot password?</Link>
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{marginTop: 24}}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
