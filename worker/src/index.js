function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return json(null, 204);

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");
    const method = request.method;

    try {
      if (path === "/api/init" && method === "POST") return handleInit(request, env);
      if (path === "/api/auth/login" && method === "POST") return handleLogin(request, env);
      if (path === "/api/auth/verify" && method === "GET") return handleVerify(request, env);
      if (path === "/api/services" && method === "GET") return handleGetServices(env);
      if (path === "/api/services" && method === "POST") return requireAuth(request, env, () => handleCreateService(request, env));
      if (path.match(/^\/api\/services\/\d+$/) && method === "PUT") return requireAuth(request, env, () => handleUpdateService(request, env, path.split("/").pop()));
      if (path.match(/^\/api\/services\/\d+$/) && method === "DELETE") return requireAuth(request, env, () => handleDeleteService(env, path.split("/").pop()));
      if (path === "/api/slots" && method === "GET") return handleGetSlots(request, env);
      if (path === "/api/slots" && method === "POST") return requireAuth(request, env, () => handleCreateSlot(request, env));
      if (path === "/api/slots/bulk" && method === "POST") return requireAuth(request, env, () => handleBulkSlots(request, env));
      if (path.match(/^\/api\/slots\/[^/]+$/) && method === "PUT") return requireAuth(request, env, () => handleUpdateSlot(request, env, path.split("/").pop()));
      if (path.match(/^\/api\/slots\/[^/]+$/) && method === "DELETE") return requireAuth(request, env, () => handleDeleteSlot(env, path.split("/").pop()));
      if (path === "/api/bookings" && method === "GET") return requireAuth(request, env, () => handleGetBookings(env));
      if (path === "/api/bookings" && method === "POST") return handleCreateBooking(request, env);
      if (path.match(/^\/api\/bookings\/[^/]+$/) && method === "PUT") return requireAuth(request, env, () => handleUpdateBooking(request, env, path.split("/").pop()));
      if (path === "/api/settings" && method === "GET") return handleGetSettings(env);
      if (path === "/api/settings" && method === "PUT") return requireAuth(request, env, () => handleUpdateSettings(request, env));
      if (path === "/api/settings/password" && method === "PUT") return requireAuth(request, env, () => handleChangePassword(request, env));
      if (path === "/api/seed-slots" && method === "POST") return handleSeedSlots(env);

      return json({ error: "Not found" }, 404);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};

function requireAuth(request, env, handler) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  return handler();
}

async function getAuthDb() {
  return {};
}

async function handleInit(request, env) {
  const { password, username } = await request.json();
  const encoder = new TextEncoder();
  const salt = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(password + salt));
  const hashHex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
  const usernameHash = await crypto.subtle.digest("SHA-256", encoder.encode((username || "admin") + salt));
  const usernameHex = Array.from(new Uint8Array(usernameHash), (b) => b.toString(16).padStart(2, "0")).join("");

  await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("_salt", JSON.stringify(salt)).run();
  await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("_passwordHash", JSON.stringify(hashHex)).run();
  await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("_usernameHash", JSON.stringify(usernameHex)).run();
  if (username) {
    await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("adminUsername", JSON.stringify(username)).run();
  }

  return json({ ok: true });
}

async function handleLogin(request, env) {
  const { username, password } = await request.json();
  const now = Date.now();

  const attempts = (await env.DB.prepare("SELECT * FROM login_attempts WHERE time > ? ORDER BY time DESC").bind(now - 900000).all()).results;
  const failedRecent = attempts.filter((a) => !a.success);
  if (failedRecent.length >= 5) {
    const oldest = failedRecent[failedRecent.length - 1];
    const retryIn = Math.ceil((oldest.time + 900000 - now) / 1000);
    return json({ error: "Too many attempts", retryIn }, 429);
  }

  const saltRow = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind("_salt").first();
  const hashRow = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind("_passwordHash").first();
  const usernameHashRow = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind("_usernameHash").first();

  if (!saltRow || !hashRow || !usernameHashRow) {
    return json({ error: "Not initialized. Call POST /api/init first." }, 400);
  }

  const salt = JSON.parse(saltRow.value);
  const storedHash = JSON.parse(hashRow.value);
  const storedUsernameHash = JSON.parse(usernameHashRow.value);
  const encoder = new TextEncoder();

  const [usernameCheck, passwordCheck] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(username + salt)),
    crypto.subtle.digest("SHA-256", encoder.encode(password + salt)),
  ]);
  const usernameHex = Array.from(new Uint8Array(usernameCheck), (b) => b.toString(16).padStart(2, "0")).join("");
  const passwordHex = Array.from(new Uint8Array(passwordCheck), (b) => b.toString(16).padStart(2, "0")).join("");

  if (usernameHex === storedUsernameHash && passwordHex === storedHash) {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = now + 3600000;
    await env.DB.prepare("INSERT INTO auth_sessions (token, expires_at) VALUES (?, ?)").bind(token, expiresAt).run();
    await env.DB.prepare("DELETE FROM login_attempts").run();
    return json({ token, expiresAt });
  }

  await env.DB.prepare("INSERT INTO login_attempts (username, success, time) VALUES (?, 0, ?)").bind(username, now).run();
  return json({ error: "Invalid credentials" }, 401);
}

async function handleVerify(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return json({ valid: false }, 401);
  const token = auth.slice(7);
  const row = await env.DB.prepare("SELECT * FROM auth_sessions WHERE token = ? AND expires_at > ?").bind(token, Date.now()).first();
  if (!row) return json({ valid: false }, 401);
  return json({ valid: true });
}

async function handleGetServices(env) {
  const { results } = await env.DB.prepare("SELECT * FROM services ORDER BY id").all();
  return json(results);
}

async function handleCreateService(request, env) {
  const body = await request.json();
  const { results } = await env.DB.prepare("INSERT INTO services (name, price, duration, description, icon, enabled) VALUES (?, ?, ?, ?, ?, ?) RETURNING *")
    .bind(body.name, body.price, body.duration || "30 min", body.description || "", body.icon || "🚗", body.enabled !== false ? 1 : 0).all();
  return json(results[0], 201);
}

async function handleUpdateService(request, env, id) {
  const body = await request.json();
  const fields = [];
  const vals = [];
  for (const key of ["name", "price", "duration", "description", "icon", "enabled"]) {
    if (body[key] !== undefined) { fields.push(`${key} = ?`); vals.push(key === "enabled" ? (body[key] ? 1 : 0) : body[key]); }
  }
  if (fields.length === 0) return json({ error: "No fields to update" }, 400);
  vals.push(id);
  const { results } = await env.DB.prepare(`UPDATE services SET ${fields.join(", ")} WHERE id = ? RETURNING *`).bind(...vals).all();
  return json(results[0] || { error: "Not found" }, results[0] ? 200 : 404);
}

async function handleDeleteService(env, id) {
  await env.DB.prepare("DELETE FROM services WHERE id = ?").bind(parseInt(id)).run();
  return json({ ok: true });
}

async function handleGetSlots(request, env) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const month = url.searchParams.get("month");
  let query = "SELECT * FROM slots";
  const params = [];
  if (date) { query += " WHERE date = ?"; params.push(date); }
  else if (month) { query += " WHERE date LIKE ?"; params.push(month + "%"); }
  query += " ORDER BY date, time";
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return json(results);
}

async function handleCreateSlot(request, env) {
  const { date, time, label, available } = await request.json();
  const id = `${date}-${time}`;
  const existing = await env.DB.prepare("SELECT id FROM slots WHERE id = ?").bind(id).first();
  if (existing) return json({ error: "Slot already exists" }, 409);
  const h = parseInt(time.split(":")[0]);
  const m = time.split(":")[1];
  const lbl = label || (h > 12 ? `${h - 12}:${m} PM` : h === 12 ? `12:${m} PM` : `${h}:${m} AM`);
  await env.DB.prepare("INSERT INTO slots (id, date, time, label, available, booked) VALUES (?, ?, ?, ?, ?, 0)").bind(id, date, time, lbl, available !== false ? 1 : 0).run();
  return json({ id, date, time, label: lbl, available: available !== false ? 1 : 0, booked: 0 }, 201);
}

async function handleUpdateSlot(request, env, id) {
  const body = await request.json();
  const fields = [];
  const vals = [];
  if (body.available !== undefined) { fields.push("available = ?"); vals.push(body.available ? 1 : 0); }
  if (body.booked !== undefined) { fields.push("booked = ?"); vals.push(body.booked ? 1 : 0); }
  if (fields.length === 0) return json({ error: "No fields" }, 400);
  vals.push(id);
  await env.DB.prepare(`UPDATE slots SET ${fields.join(", ")} WHERE id = ?`).bind(...vals).run();
  return json({ ok: true });
}

async function handleDeleteSlot(env, id) {
  await env.DB.prepare("DELETE FROM slots WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

async function handleBulkSlots(request, env) {
  const { date, available } = await request.json();
  const { results } = await env.DB.prepare("SELECT * FROM slots WHERE date = ? AND booked = 0").bind(date).all();
  for (const s of results) {
    await env.DB.prepare("UPDATE slots SET available = ? WHERE id = ?").bind(available ? 1 : 0, s.id).run();
  }
  return json({ ok: true, updated: results.length });
}

async function handleGetBookings(env) {
  const { results } = await env.DB.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all();
  return json(results);
}

async function handleCreateBooking(request, env) {
  const body = await request.json();
  const id = Date.now().toString();
  await env.DB.prepare("INSERT INTO bookings (id, name, car_make, car_model, car_plate, service, date, time, notes, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')")
    .bind(id, body.name, body.carMake || "", body.carModel || "", body.carPlate || "", body.service || "", body.date || "", body.time || "", body.notes || "", body.phone || "").run();
  if (body.slotDate && body.slotTime) {
    const slotId = `${body.slotDate}-${body.slotTime}`;
    await env.DB.prepare("UPDATE slots SET booked = 1 WHERE id = ?").bind(slotId).run();
  }
  return json({ id, status: "pending" }, 201);
}

async function handleUpdateBooking(request, env, id) {
  const { status } = await request.json();
  await env.DB.prepare("UPDATE bookings SET status = ? WHERE id = ?").bind(status, id).run();
  return json({ ok: true });
}

async function handleGetSettings(env) {
  const { results } = await env.DB.prepare("SELECT * FROM settings").all();
  const obj = {};
  for (const r of results) {
    if (!r.key.startsWith("_")) {
      try { obj[r.key] = JSON.parse(r.value); } catch { obj[r.key] = r.value; }
    }
  }
  return json(obj);
}

async function handleUpdateSettings(request, env) {
  const body = await request.json();
  for (const [key, value] of Object.entries(body)) {
    if (!key.startsWith("_")) {
      await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind(key, JSON.stringify(value)).run();
    }
  }
  return json({ ok: true });
}

async function handleChangePassword(request, env) {
  const { password, username } = await request.json();
  const saltRow = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind("_salt").first();
  const salt = saltRow ? JSON.parse(saltRow.value) : crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  if (!saltRow) await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("_salt", JSON.stringify(salt)).run();
  const encoder = new TextEncoder();
  if (password) {
    const hash = await crypto.subtle.digest("SHA-256", encoder.encode(password + salt));
    const hex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("_passwordHash", JSON.stringify(hex)).run();
  }
  if (username) {
    const hash = await crypto.subtle.digest("SHA-256", encoder.encode(username + salt));
    const hex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("_usernameHash", JSON.stringify(hex)).run();
    await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("adminUsername", JSON.stringify(username)).run();
  }
  return json({ ok: true });
}

async function handleSeedSlots(env) {
  const existing = await env.DB.prepare("SELECT COUNT(*) as cnt FROM slots").first();
  if (existing.cnt > 0) return json({ ok: true, skipped: true, count: existing.cnt });
  const slots = [];
  const times = [];
  for (let h = 9; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const min = m.toString().padStart(2, "0");
      const label = h > 12 ? `${h - 12}:${min} PM` : h === 12 ? `12:${min} PM` : `${h}:${min} AM`;
      times.push({ value: `${hour}:${min}`, label });
    }
  }
  const today = new Date();
  for (let d = 0; d < 30; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue;
    for (const t of times) {
      slots.push({ id: `${dateStr}-${t.value}`, date: dateStr, time: t.value, label: t.label });
    }
  }
  const batch = env.DB.batch(slots.map((s) => env.DB.prepare("INSERT INTO slots (id, date, time, label, available, booked) VALUES (?, ?, ?, ?, 1, 0)").bind(s.id, s.date, s.time, s.label)));
  await batch;
  return json({ ok: true, count: slots.length });
}
