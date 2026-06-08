import servicesData from "../data/services";

const SLOTS_KEY = "carwash_slots";
const SERVICES_KEY = "carwash_services";
const BOOKINGS_KEY = "carwash_bookings";
const SETTINGS_KEY = "carwash_settings";
const LOGIN_ATTEMPTS_KEY = "carwash_login_attempts";
const SALT_KEY = "carwash_salt";

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
  let salt = localStorage.getItem(SALT_KEY);
  if (!salt) {
    salt = generateSalt();
    localStorage.setItem(SALT_KEY, salt);
  }
  return salt;
}

export async function verifyPassword(inputPassword, storedHash) {
  const salt = getStoredSalt();
  const hash = await hashPassword(inputPassword, salt);
  return hash === storedHash;
}

export async function hashAndStorePassword(password) {
  const salt = getStoredSalt();
  return await hashPassword(password, salt);
}

export function getLoginAttempts() {
  try {
    const data = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function recordLoginAttempt(username, success) {
  const attempts = getLoginAttempts();
  const now = Date.now();
  attempts.push({ username, success, time: now });
  const recent = attempts.filter((a) => now - a.time < 900000);
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(recent));
}

export function isRateLimited() {
  const attempts = getLoginAttempts();
  const now = Date.now();
  const recent = attempts.filter((a) => now - a.time < 900000);
  if (recent.filter((a) => !a.success).length >= 5) {
    const oldest = recent.filter((a) => !a.success)[0];
    if (now - oldest.time < 900000) {
      return Math.ceil((oldest.time + 900000 - now) / 1000);
    }
  }
  return 0;
}

export function isLockedOut() {
  const attempts = getLoginAttempts();
  const now = Date.now();
  const recent = attempts.filter((a) => now - a.time < 900000);
  const failed = recent.filter((a) => !a.success);
  return failed.length >= 5;
}

export function clearLoginAttempts() {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
}

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
  if (!token || Date.now() > expiry) {
    clearAuthSession();
    return false;
  }
  return true;
}

export function clearAuthSession() {
  sessionStorage.removeItem("admin_token");
  sessionStorage.removeItem("admin_expiry");
}

export function getSlots() {
  try {
    const data = localStorage.getItem(SLOTS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setSlots(slots) {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function getServices() {
  try {
    const data = localStorage.getItem(SERVICES_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setServices(services) {
  localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
}

export function getBookings() {
  try {
    const data = localStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setBookings(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export function addBooking(booking) {
  const bookings = getBookings() || [];
  const newBooking = {
    ...booking,
    id: Date.now().toString(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  bookings.unshift(newBooking);
  setBookings(bookings);
  return newBooking;
}

export function getSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getDefaultSettings() {
  return {
    businessName: "AB Washing",
    adminWhatsApp: "8590384225",
    adminPassword: "admin123",
    adminUsername: "admin",
    workingHours: { start: "09:00", end: "18:00" },
    slotInterval: 30,
    address: "123 Auto Street, Dubai",
    phone: "+971 50 123 4567",
    email: "info@premiumcarwash.com",
  };
}

export async function initStorage() {
  if (!getServices()) {
    setServices(servicesData);
  }
  if (!getSettings()) {
    setSettings(getDefaultSettings());
  }
  const settings = getSettings();
  if (settings && !settings._passwordHash) {
    const hash = await hashPassword(settings.adminPassword, getStoredSalt());
    settings._passwordHash = hash;
    settings._usernameHash = await hashPassword(settings.adminUsername || "admin", getStoredSalt());
    delete settings.adminPassword;
    setSettings(settings);
  }
}
