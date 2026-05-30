// ─── EventSphere API Client ────────────────────────────────────────────────────
// In dev, Vite proxies /api → http://localhost:5000
// In prod, set VITE_API_URL to your deployed backend URL

const BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

// ─── Token helpers ─────────────────────────────────────────────────────────────

// ─── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('es_token');
export const getUser  = () => {
  try { return JSON.parse(localStorage.getItem('es_user') || 'null'); } catch { return null; }
};
export const saveAuth = (token, user) => {
  localStorage.setItem('es_token', token);
  localStorage.setItem('es_user', JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem('es_token');
  localStorage.removeItem('es_user');
};

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function req(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Handle validation errors
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
      throw Object.assign(new Error(errorMessages || 'Validation failed'), { status: res.status, data });
    }
    throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status, data });
  }
  return data;
}

export const api = {
  get:    (path, auth)       => req('GET',    path, null, auth),
  post:   (path, body, auth) => req('POST',   path, body, auth),
  patch:  (path, body)       => req('PATCH',  path, body),
  delete: (path)             => req('DELETE', path),
};

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body) => api.post('/api/auth/register', body, false),
  login:    (body) => api.post('/api/auth/login',    body, false),
  me:       ()     => api.get('/api/auth/me'),
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsApi = {
  list:          (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/api/events${qs ? '?' + qs : ''}`, false);
  },
  get:           (id)       => api.get(`/api/events/${id}`, false),
  myEvents:      ()         => api.get('/api/events/my/events'),
  create:        (body)     => api.post('/api/events', body),
  update:        (id, body) => api.patch(`/api/events/${id}`, body),
  delete:        (id)       => api.delete(`/api/events/${id}`),
  addTicketType: (id, body) => api.post(`/api/events/${id}/ticket-types`, body),
  analytics:     (id)       => api.get(`/api/events/${id}/analytics`),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  buy:      (body) => api.post('/api/orders', body),
  myOrders: ()     => api.get('/api/orders/my'),
  getOrder: (id)   => api.get(`/api/orders/${id}`),
};

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const ticketsApi = {
  validate:     (qrCodeData) => api.post('/api/tickets/validate', { qrCodeData }),
  eventTickets: (eventId)    => api.get(`/api/tickets/event/${eventId}`),
  getTicket:    (id)         => api.get(`/api/tickets/${id}`),
};

// ─── Vendors ──────────────────────────────────────────────────────────────────
export const vendorsApi = {
  getProfile:        ()                    => api.get('/api/vendors/profile'),
  updateProfile:     (body)                => api.patch('/api/vendors/profile', body),
  apply:             (eventId, body)       => api.post(`/api/vendors/apply/${eventId}`, body),
  myApplications:    ()                    => api.get('/api/vendors/applications/my'),
  addProduct:        (body)                => api.post('/api/vendors/products', body),
  updateProduct:     (productId, body)     => api.patch(`/api/vendors/products/${productId}`, body),
  deleteProduct:     (productId)           => api.delete(`/api/vendors/products/${productId}`),
  eventApplications: (eventId)             => api.get(`/api/vendors/applications/event/${eventId}`),
  reviewApplication: (applicationId, body) => api.patch(`/api/vendors/applications/${applicationId}`, body),
  eventProducts:     (eventId)             => api.get(`/api/vendors/products/event/${eventId}`, false),
};

export default api;
