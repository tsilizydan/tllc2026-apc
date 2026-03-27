import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import HomePage      from './pages/HomePage'
import ShopPage      from './pages/ShopPage'
import ProductPage   from './pages/ProductPage'
import CartPage      from './pages/CartPage'
import CheckoutPage  from './pages/CheckoutPage'
import LoginPage     from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage     from './pages/AdminPage'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"           element={<HomePage />} />
            <Route path="/shop"       element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/cart"       element={<CartPage />} />
            <Route path="/login"      element={<LoginPage />} />
            <Route path="/checkout"   element={<CheckoutPage />} />
            <Route path="/dashboard"  element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/admin"      element={
              <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
            } />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  )
}

function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AppLayout />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  )
}

export default App
