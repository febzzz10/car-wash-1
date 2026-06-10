import { api } from "./api";
import servicesData from "../data/services";
import generateTimeSlots from "../data/defaultSlots";

const SLOTS_KEY = "carwash_slots";
const SERVICES_KEY = "carwash_services";
const BOOKINGS_KEY = "carwash_bookings";
const SETTINGS_KEY = "carwash_settings";

function lget(key) { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch { return null; } }
function lset(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

export function getServices() { return lget(SERVICES_KEY) || servicesData; }
export function setServices(s) { lset(SERVICES_KEY, s); }

export async function syncServices() {
  try { const data = await api.getServices(); if (data) { lset(SERVICES_KEY, data); return data; } } catch {}
  return null;
}
export async function syncServiceUpdate(id, fields) {
  try { await api.updateService(id, fields); } catch {}
}
export async function syncServiceDelete(id) {
  try { await api.deleteService(id); } catch {}
}
export async function syncServiceCreate(data) {
  try { return await api.createService(data); } catch {}
}

export function getSlots() { return lget(SLOTS_KEY); }
export function setSlots(s) { lset(SLOTS_KEY, s); }

export async function syncSlots(params) {
  try { const data = await api.getSlots(params); if (data && data.length > 0) { lset(SLOTS_KEY, data); return data; } } catch {}
  return null;
}
export async function syncSlotUpdate(id, fields) {
  try { await api.updateSlot(id, fields); } catch {}
}
export async function syncSlotDelete(id) {
  try { await api.deleteSlot(id); } catch {}
}
export async function syncSlotCreate(data) {
  try { return await api.createSlot(data); } catch {}
}
export async function syncBulkSlots(date, available) {
  try { await api.bulkSlots(date, available); } catch {}
}

export function getBookings() { return lget(BOOKINGS_KEY) || []; }
export function setBookings(b) { lset(BOOKINGS_KEY, b); }

export async function syncBookings() {
  try { const data = await api.getBookings(); if (data) { lset(BOOKINGS_KEY, data); return data; } } catch {}
  return null;
}
export async function syncBookingUpdate(id, status) {
  try { await api.updateBooking(id, status); } catch {}
}

export async function addBooking(booking) {
  const newBooking = {
    ...booking, id: Date.now().toString(), status: "pending", createdAt: new Date().toISOString(),
  };
  const bookings = getBookings();
  bookings.unshift(newBooking);
  setBookings(bookings);
  try { await api.createBooking(booking); } catch {}
  return newBooking;
}

export function getSettings() { return lget(SETTINGS_KEY); }
export function setSettings(s) { lset(SETTINGS_KEY, s); }

export async function syncSettings() {
  try { const data = await api.getSettings(); if (data) { lset(SETTINGS_KEY, data); return data; } } catch {}
  return null;
}
export async function syncSettingsUpdate(data) {
  try { await api.updateSettings(data); } catch {}
}

export function getDefaultSettings() {
  return {
    businessName: "AB Washing", adminWhatsApp: "8590384225",
    adminPassword: "admin123", adminUsername: "admin",
    workingHours: { start: "09:00", end: "18:00" }, slotInterval: 30,
    address: "123 Auto Street, Dubai", phone: "+971 50 123 4567",
    email: "info@premiumcarwash.com",
  };
}

export async function seedInitialSlots() {
  try { await api.seedSlots(); } catch {}
  if (!getSlots()) { setSlots(generateTimeSlots()); }
}

export async function initStorage() {
  if (!getServices()) setServices(servicesData);
  if (!getSettings()) setSettings(getDefaultSettings());
  if (!getSlots()) setSlots(generateTimeSlots());
  try {
    const services = await api.getServices();
    if (!services || services.length === 0) {
      const pw = getDefaultSettings().adminPassword;
      await api.init(pw, "admin");
      for (const s of servicesData) await api.createService(s);
    }
    await api.seedSlots();
  } catch {}
}

// Auth
function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

function getStoredSalt() {
  let salt = localStorage.getItem("carwash_salt");
  if (!salt) { salt = generateSalt(); localStorage.setItem("carwash_salt", salt); }
  return salt;
}

export async function verifyPassword(inputPassword, storedHash) {
  return await hashPassword(inputPassword, getStoredSalt()) === storedHash;
}

export async function hashAndStorePassword(password) {
  return await hashPassword(password, getStoredSalt());
}

export function getLoginAttempts() {
  try { const d = localStorage.getItem("carwash_login_attempts"); return d ? JSON.parse(d) : []; } catch { return []; }
}

export function recordLoginAttempt(username, success) {
  const attempts = getLoginAttempts();
  const now = Date.now();
  attempts.push({ username, success, time: now });
  lset("carwash_login_attempts", attempts.filter((a) => now - a.time < 900000));
}

export function isRateLimited() {
  const attempts = getLoginAttempts();
  const now = Date.now();
  const recent = attempts.filter((a) => now - a.time < 900000);
  if (recent.filter((a) => !a.success).length >= 5) {
    const oldest = recent.filter((a) => !a.success)[0];
    if (now - oldest.time < 900000) return Math.ceil((oldest.time + 900000 - now) / 1000);
  }
  return 0;
}

export function clearLoginAttempts() { localStorage.removeItem("carwash_login_attempts"); }

export function setAuthSession() {
  const token = generateSalt() + generateSalt();
  const expiry = Date.now() + 3600000;
  sessionStorage.setItem("admin_token", token);
  sessionStorage.setItem("admin_expiry", expiry.toString());
  return token;
}

export function validateAuthSession() {
  const token = sessionStorage.getItem("admin_token");
  const expiry = parseInt(sessionStorage.getItem("admin_expiry") || "0", 10);
  if (!token || Date.now() > expiry) { clearAuthSession(); return false; }
  return true;
}

export function clearAuthSession() {
  sessionStorage.removeItem("admin_token");
  sessionStorage.removeItem("admin_expiry");
}
