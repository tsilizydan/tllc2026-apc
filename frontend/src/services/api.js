/**
 * Apos'Creed — API Service Layer
 * All fetch() calls to the PHP backend go through here.
 */

const BASE = import.meta.env.PROD ? '/api' : '/api'

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE}/${endpoint}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const data = await res.json()
  if (!data.success && res.status >= 400) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}

export const api = {
  get:    (endpoint, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(endpoint + (qs ? '?' + qs : ''))
  },
  post:   (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put:    (endpoint, body) => request(endpoint, { method: 'PUT',  body: JSON.stringify(body) }),
  delete: (endpoint, body) => request(endpoint, { method: 'DELETE', body: JSON.stringify(body) }),
}

// ── Auth ──────────────────────────────────
export const authService = {
  register: (data)  => api.post('auth.php', { action: 'register', ...data }),
  login:    (data)  => api.post('auth.php', { action: 'login',    ...data }),
  logout:   ()      => api.post('auth.php', { action: 'logout' }),
  me:       ()      => api.get('auth.php',  { action: 'me' }),
  forgot:   (email) => api.post('auth.php', { action: 'forgot_password', email }),
  reset:    (data)  => api.post('auth.php', { action: 'reset_password', ...data }),
}

// ── Products ──────────────────────────────
export const productService = {
  list:     (params) => api.get('products.php', { action: 'list', ...params }),
  single:   (slug)   => api.get('products.php', { action: 'single', slug }),
  featured: (limit)  => api.get('products.php', { action: 'featured', limit }),
  related:  (productId, categoryId) =>
    api.get('products.php', { action: 'related', product_id: productId, category_id: categoryId, limit: 4 }),
  search:   (q)      => api.get('products.php', { action: 'search', q }),
}

// ── Categories ────────────────────────────
export const categoryService = {
  list:   () => api.get('categories.php', { action: 'list' }),
  single: (slug) => api.get('categories.php', { action: 'single', slug }),
}

// ── Cart ──────────────────────────────────
export const cartService = {
  get:    ()           => api.get('cart.php',  { action: 'get' }),
  add:    (productId, quantity = 1) =>
    api.post('cart.php', { action: 'add', product_id: productId, quantity }),
  update: (cartId, quantity) =>
    api.post('cart.php', { action: 'update', cart_id: cartId, quantity }),
  remove: (cartId) => api.post('cart.php', { action: 'remove', cart_id: cartId }),
  clear:  ()       => api.post('cart.php', { action: 'clear' }),
}

// ── Orders ────────────────────────────────
export const orderService = {
  create: (data)   => api.post('orders.php', { action: 'create', ...data }),
  list:   ()       => api.get('orders.php',  { action: 'list' }),
  single: (id)     => api.get('orders.php',  { action: 'single', id }),
  track:  (number, email = '') =>
    api.get('orders.php', { action: 'track', number, email }),
}

// ── Reviews ───────────────────────────────
export const reviewService = {
  list: (productId, page = 1) =>
    api.get('reviews.php', { action: 'list', product_id: productId, page }),
  add:  (data) => api.post('reviews.php', { action: 'add', ...data }),
}

// ── Payments ──────────────────────────────
export const paymentService = {
  initiate: (orderNumber, paymentMethod, extras = {}) =>
    api.post('payments.php', { action: 'initiate', order_number: orderNumber, payment_method: paymentMethod, ...extras }),
  status: (orderNumber) =>
    api.get('payments.php', { action: 'status', order_number: orderNumber }),
}

// ── Admin ─────────────────────────────────
export const adminService = {
  dashboard:      () => api.get('admin/dashboard.php'),
  // Products
  listProducts:   (params) => api.get('admin/products.php', { action: 'list', ...params }),
  createProduct:  (data)   => api.post('admin/products.php?action=create', data),
  updateProduct:  (data)   => api.post('admin/products.php?action=update', data),
  deleteProduct:  (id)     => api.post('admin/products.php?action=delete', { id }),
  // Categories
  listCategories: ()       => api.get('admin/categories.php', { action: 'list' }),
  createCategory: (data)   => api.post('admin/categories.php?action=create', data),
  updateCategory: (data)   => api.post('admin/categories.php?action=update', data),
  deleteCategory: (id)     => api.post('admin/categories.php?action=delete', { id }),
  // Orders
  listOrders:     (params) => api.get('admin/orders.php', { action: 'list', ...params }),
  singleOrder:    (id)     => api.get('admin/orders.php', { action: 'single', id }),
  updateOrderStatus: (id, status) =>
    api.post('admin/orders.php?action=update_status', { id, status }),
  // Settings
  getSettings:    () => api.get('admin/settings.php', { action: 'get' }),
  updateSettings: (data) => api.post('admin/settings.php?action=update', data),
}
