import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartService } from '../services/api'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart]           = useState({ items: [], subtotal: 0, count: 0 })
  const [cartLoading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    try {
      const res = await cartService.get()
      setCart(res.data)
    } catch {}
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addToCart = useCallback(async (productId, quantity = 1) => {
    setLoading(true)
    try {
      const res = await cartService.add(productId, quantity)
      setCart(res.data)
      return res
    } finally {
      setLoading(false)
    }
  }, [])

  const updateItem = useCallback(async (cartId, quantity) => {
    const res = await cartService.update(cartId, quantity)
    setCart(res.data)
  }, [])

  const removeItem = useCallback(async (cartId) => {
    const res = await cartService.remove(cartId)
    setCart(res.data)
  }, [])

  const clearCart = useCallback(async () => {
    const res = await cartService.clear()
    setCart(res.data)
  }, [])

  return (
    <CartContext.Provider value={{ cart, cartLoading, addToCart, updateItem, removeItem, clearCart, refreshCart: fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
