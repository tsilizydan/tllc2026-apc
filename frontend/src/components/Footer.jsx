import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <span>APOS</span><span style={{color:'var(--accent-blue)'}}>&#39;</span><span style={{color:'var(--accent-purple)'}}>CREED</span>
          </Link>
          <p>Madagascar's premier gaming e-commerce destination. Premium games, fast delivery, unbeatable prices.</p>
          <div className="footer__social">
            {[['Facebook','https://facebook.com'],['Instagram','https://instagram.com'],['Twitter','https://twitter.com']].map(([name, href]) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="social-link">{name[0]}</a>
            ))}
          </div>
        </div>
        <div className="footer__links">
          <h4>Shop</h4>
          <Link to="/shop">All Products</Link>
          <Link to="/shop?category=pc-games">PC Games</Link>
          <Link to="/shop?category=playstation">PlayStation</Link>
          <Link to="/shop?category=xbox">Xbox</Link>
          <Link to="/shop?category=accessories">Accessories</Link>
          <Link to="/shop?category=gift-cards">Gift Cards</Link>
        </div>
        <div className="footer__links">
          <h4>Account</h4>
          <Link to="/login">Sign In</Link>
          <Link to="/login">Create Account</Link>
          <Link to="/dashboard">My Orders</Link>
        </div>
        <div className="footer__links">
          <h4>Support</h4>
          <a href="mailto:contact@aposcreed.mg">contact@aposcreed.mg</a>
          <span>+261 34 00 000 00</span>
          <span>Mon–Sat 8am–8pm</span>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} Apos'Creed. All rights reserved.</span>
          <div className="payment-badges">
            <span className="pay-badge">Mvola</span>
            <span className="pay-badge">Orange Money</span>
            <span className="pay-badge">Airtel Money</span>
            <span className="pay-badge">COD</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
