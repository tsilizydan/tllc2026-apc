import { createContext, useContext, useState, useCallback, useId } from 'react'
import './Toast.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const toast = {
    success: (m, d) => addToast(m, 'success', d),
    error:   (m, d) => addToast(m, 'error',   d),
    info:    (m, d) => addToast(m, 'info',    d),
    warning: (m, d) => addToast(m, 'warning', d),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{iconFor(t.type)}</span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function iconFor(type) {
  return { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }[type] || 'ℹ'
}

export const useToast = () => useContext(ToastContext)
