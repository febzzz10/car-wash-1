const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

async function request(path, options = {}) {
  const token = sessionStorage.getItem("admin_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  // Auth
  init: (password, username) => request("/api/init", { method: "POST", body: JSON.stringify({ password, username }) }),
  login: (username, password) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  verify: () => request("/api/auth/verify"),

  // Services
  getServices: () => request("/api/services"),
  createService: (data) => request("/api/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/api/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id) => request(`/api/services/${id}`, { method: "DELETE" }),

  // Slots
  getSlots: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/slots${q ? `?${q}` : ""}`);
  },
  createSlot: (data) => request("/api/slots", { method: "POST", body: JSON.stringify(data) }),
  updateSlot: (id, data) => request(`/api/slots/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSlot: (id) => request(`/api/slots/${encodeURIComponent(id)}`, { method: "DELETE" }),
  bulkSlots: (date, available) => request("/api/slots/bulk", { method: "POST", body: JSON.stringify({ date, available }) }),
  seedSlots: () => request("/api/seed-slots", { method: "POST" }),

  // Bookings
  getBookings: () => request("/api/bookings"),
  createBooking: (data) => request("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
  updateBooking: (id, status) => request(`/api/bookings/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),

  // Settings
  getSettings: () => request("/api/settings"),
  updateSettings: (data) => request("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (data) => request("/api/settings/password", { method: "PUT", body: JSON.stringify(data) }),
};
