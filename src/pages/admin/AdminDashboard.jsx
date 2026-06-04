import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSlots, setSlots, getServices, setServices,
  getBookings, setBookings, getSettings, setSettings,
  getDefaultSettings, validateAuthSession, clearAuthSession,
  hashAndStorePassword,
} from "../../utils/storage";
import servicesData from "../../data/services";
import generateTimeSlots from "../../data/defaultSlots";

function Protected({ children }) {
  const navigate = useNavigate();
  const [valid, setValid] = useState(null);

  useEffect(() => {
    const check = () => {
      const ok = validateAuthSession();
      setValid(ok);
      if (!ok) {
        clearAuthSession();
        navigate("/admin", { replace: true });
      }
    };
    check();

    const refreshSession = () => {
      sessionStorage.setItem("admin_expiry", (Date.now() + 3600000).toString());
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, refreshSession));

    return () => {
      events.forEach((e) => window.removeEventListener(e, refreshSession));
    };
  }, [navigate]);

  if (valid === null) return null;
  if (!valid) return null;

  return children;
}

function SlotManager() {
  const [slots, setLocalSlots] = useState(() => {
    let data = getSlots();
    if (!data) {
      data = generateTimeSlots();
      setSlots(data);
    }
    return data;
  });
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return now.getMonth();
  });
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [newTime, setNewTime] = useState("09:00");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const [pickerHour, setPickerHour] = useState("9");
  const [pickerMinute, setPickerMinute] = useState("00");
  const [pickerPeriod, setPickerPeriod] = useState("AM");

  useEffect(() => {
    if (!pickerOpen) return;
    const [h, m] = newTime.split(":");
    const hour = parseInt(h);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    setPickerHour(String(hour12));
    setPickerMinute(m);
    setPickerPeriod(period);
  }, [pickerOpen]);

  useEffect(() => {
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleWheelChange = (type, val) => {
    let h = type === "hour" ? val : pickerHour;
    let m = type === "minute" ? val : pickerMinute;
    let p = type === "period" ? val : pickerPeriod;
    let hour24 = parseInt(h);
    if (p === "PM" && hour24 !== 12) hour24 += 12;
    if (p === "AM" && hour24 === 12) hour24 = 0;
    setNewTime(`${String(hour24).padStart(2, "0")}:${m}`);
    if (type === "hour") setPickerHour(val);
    else if (type === "minute") setPickerMinute(val);
    else setPickerPeriod(val);
  };

  const updateSlots = (updated) => {
    setLocalSlots(updated);
    setSlots(updated);
  };

  const lockSlot = (id) => {
    const updated = slots.map((s) =>
      s.id === id ? { ...s, available: !s.available } : s
    );
    updateSlots(updated);
  };

  const deleteSlot = (id) => {
    updateSlots(slots.filter((s) => s.id !== id));
  };

  const addSlot = () => {
    if (!selectedDate || !newTime) return;
    const id = `${selectedDate}-${newTime}`;
    if (slots.some((s) => s.id === id)) return;
    const hour = parseInt(newTime.split(":")[0]);
    const min = newTime.split(":")[1];
    const label = hour > 12 ? `${hour - 12}:${min} PM` : hour === 12 ? `12:${min} PM` : `${hour}:${min} AM`;
    updateSlots([
      ...slots,
      { id, date: selectedDate, time: newTime, label, available: true, booked: false },
    ].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
  };

  const daySlots = slots.filter((s) => s.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  // Calendar helpers
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const fmt = (d) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="text-muted hover:text-text-bright text-xl px-2">&larr;</button>
        <h3 className="font-display font-bold text-text-bright text-xl">{monthNames[viewMonth]} {viewYear}</h3>
        <button onClick={nextMonth} className="text-muted hover:text-text-bright text-xl px-2">&rarr;</button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="text-xs text-muted font-mono py-1 font-bold">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
          const hasSlots = slots.some((s) => s.date === dateStr && s.available && !s.booked);
          const allBookedOrLocked = slots.some((s) => s.date === dateStr) && !slots.some((s) => s.date === dateStr && s.available && !s.booked);
          return (
            <button
              key={day}
              onClick={() => { setSelectedDate(dateStr); }}
              disabled={false}
              className={`text-sm py-2.5 rounded-lg transition-all relative font-medium ${
                isSelected
                  ? "bg-primary text-white font-bold"
                  : isToday
                    ? "bg-primary/20 text-text-bright font-bold"
                    : "text-text hover:bg-surface hover:text-text-bright"
              }`}
            >
              {day}
              {hasSlots && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              {allBookedOrLocked && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date header */}
      <div className="border-t border-line pt-4">
        <p className="font-mono text-xs text-muted tracking-[0.05em] mb-3">
          Slots for <span className="text-text-bright font-bold">{fmt(selectedDate)}</span>
        </p>

        {/* Slot timeline */}
        {daySlots.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">No slots for this date. Add one below.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {daySlots.map((slot) => {
              const isBooked = slot.booked;
              const isLocked = !slot.available && !slot.booked;
              return (
                <div
                  key={slot.id}
                  onClick={() => { if (!isBooked) lockSlot(slot.id); }}
                  className={`group relative px-4 py-2 rounded-full text-sm font-mono cursor-pointer transition-all border flex items-center gap-2 ${
                    isBooked
                      ? "bg-booked/10 border-booked/30 text-booked line-through cursor-not-allowed"
                      : isLocked
                        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                        : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                  }`}
                  title={isBooked ? "Booked by customer" : isLocked ? "Click to unlock" : "Click to lock"}
                >
                  <span>{slot.label}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                    className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-booked"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary/50" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500/50" /> Locked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-booked/50" /> Booked</span>
        </div>
      </div>

      {/* Add slot controls */}
      <div className="border-t border-line pt-4 space-y-4">
        <p className="font-mono text-xs text-muted tracking-[0.05em] font-bold">Add Slots</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">Time</label>
            <div className="flex gap-2 relative" ref={pickerRef}>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="!py-2 !px-3 text-sm w-32"
              />
              <button
                type="button"
                onClick={() => setPickerOpen((p) => !p)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-secondary hover:border-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </button>
              {pickerOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-surface border border-secondary rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-0">
                    <Wheel
                      items={["1","2","3","4","5","6","7","8","9","10","11","12"]}
                      value={pickerHour}
                      onChange={(v) => handleWheelChange("hour", v)}
                      label="Hour"
                    />
                    <span className="text-2xl text-text-bright font-bold font-mono mt-[-18px] self-center">:</span>
                    <Wheel
                      items={["00","05","10","15","20","25","30","35","40","45","50","55"]}
                      value={pickerMinute}
                      onChange={(v) => handleWheelChange("minute", v)}
                      label="Min"
                    />
                    <Wheel
                      items={["AM","PM"]}
                      value={pickerPeriod}
                      onChange={(v) => handleWheelChange("period", v)}
                      label="Period"
                    />
                  </div>
                  <button
                    onClick={() => setPickerOpen(false)}
                    className="mt-3 w-full bg-primary text-white font-bold text-sm py-2 rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
          <button onClick={addSlot} className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-all">
            + Add
          </button>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <button
            onClick={() => {
              const updated = slots.map((s) =>
                s.date === selectedDate && !s.booked ? { ...s, available: false } : s
              );
              updateSlots(updated);
            }}
            className="bg-booked/20 text-booked border border-booked/30 text-sm px-4 py-2 rounded-lg hover:bg-booked/30 transition-all font-bold"
          >
            Lock All
          </button>
          <button
            onClick={() => {
              const updated = slots.map((s) =>
                s.date === selectedDate && !s.booked ? { ...s, available: true } : s
              );
              updateSlots(updated);
            }}
            className="bg-primary/20 text-primary border border-primary/30 text-sm px-4 py-2 rounded-lg hover:bg-primary/30 transition-all font-bold"
          >
            Unlock All
          </button>
        </div>
      </div>
    </div>
  );
}

function Wheel({ items, value, onChange, label }) {
  const ITEM_H = 34;
  const RADIUS = 3;
  const HEIGHT = ITEM_H * (RADIUS * 2 + 1);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ startY: 0, startOff: 0, lastY: 0, lastT: 0, vel: 0 });
  const momentum = useRef(null);

  useEffect(() => () => { if (momentum.current) cancelAnimationFrame(momentum.current); }, []);

  const idx = items.indexOf(value);

  const snap = (vel = 0) => {
    const total = idx * ITEM_H + offset;
    const nearest = Math.round(total / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, nearest));
    if (clamped !== idx && items[clamped] !== value) onChange(items[clamped]);
    setOffset(0);
  };

  const startMomentum = (vel) => {
    if (momentum.current) cancelAnimationFrame(momentum.current);
    let v = vel;
    const step = () => {
      v *= 0.93;
      if (Math.abs(v) < 0.5) { momentum.current = null; snap(v); return; }
      setOffset((prev) => prev + v);
      momentum.current = requestAnimationFrame(step);
    };
    momentum.current = requestAnimationFrame(step);
  };

  const onDown = (clientY) => {
    if (momentum.current) { cancelAnimationFrame(momentum.current); momentum.current = null; }
    drag.current = { startY: clientY, startOff: offset, lastY: clientY, lastT: Date.now(), vel: 0 };
    setDragging(true);
  };
  const onMove = (clientY) => {
    if (!dragging) return;
    const delta = clientY - drag.current.startY;
    const now = Date.now();
    const dt = now - drag.current.lastT;
    if (dt > 0) drag.current.vel = (clientY - drag.current.lastY) / dt * 16;
    drag.current.lastY = clientY;
    drag.current.lastT = now;
    setOffset(drag.current.startOff + delta);
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(drag.current.vel) > 2) { startMomentum(drag.current.vel); }
    else { snap(); }
  };

  const center = idx * ITEM_H + offset;
  const visible = items.map((item, i) => ({ item, dist: (i * ITEM_H - center) / ITEM_H, i })).filter(({ dist }) => Math.abs(dist) <= RADIUS + 0.5);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden select-none touch-none w-14 sm:w-16"
        style={{ height: HEIGHT }}
        onMouseDown={(e) => onDown(e.clientY)}
        onMouseMove={(e) => dragging && onMove(e.clientY)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={(e) => onDown(e.touches[0].clientY)}
        onTouchMove={(e) => dragging && onMove(e.touches[0].clientY)}
        onTouchEnd={onUp}
        onWheel={(e) => { setOffset((prev) => prev - Math.sign(e.deltaY) * ITEM_H); }}
      >
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[34px] border-y border-primary/20 pointer-events-none z-10" />
        {visible.sort((a, b) => Math.abs(a.dist) - Math.abs(b.dist)).map(({ item, dist, i }) => {
          const abs = Math.abs(dist);
          const scale = Math.max(0.45, 1 - abs * 0.18);
          const opacity = Math.max(0.15, 1 - abs * 0.28);
          const y = dist * ITEM_H + HEIGHT / 2 - ITEM_H / 2;
          const c = abs < 0.5;
          return (
            <div
              key={i}
              className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
              style={{ height: ITEM_H, top: 0, transform: `translateY(${y}px) scale(${scale})`, opacity }}
            >
              <span className={`font-mono text-sm transition-colors ${c ? "text-text-bright font-bold text-base" : "text-muted"}`}>
                {String(item).padStart(2, "0")}
              </span>
            </div>
          );
        })}
      </div>
      {label && <span className="text-[10px] text-muted mt-1 uppercase tracking-wider">{label}</span>}
    </div>
  );
}

function ServiceManager() {
  const [services, setLocalServices] = useState(() => getServices() || servicesData);

  const updateService = (id, field, value) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, [field]: value } : s
    );
    setLocalServices(updated);
    setServices(updated);
  };

  const addService = () => {
    const newSvc = {
      id: Date.now(),
      name: "New Service",
      price: 0,
      duration: "30 min",
      description: "Description here",
      enabled: true,
    };
    const updated = [...services, newSvc];
    setLocalServices(updated);
    setServices(updated);
  };

  const deleteService = (id) => {
    const updated = services.filter((s) => s.id !== id);
    setLocalServices(updated);
    setServices(updated);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={addService}
        className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-primary/90 transition-all"
      >
        + Add Service
      </button>
      <div className="space-y-4">
        {services.map((svc) => (
          <div
            key={svc.id}
            className={`p-4 rounded-xl border ${
              svc.enabled ? "border-secondary bg-surface/50" : "border-secondary bg-surface/20 opacity-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{svc.icon}</span>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input
                  value={svc.name}
                  onChange={(e) => updateService(svc.id, "name", e.target.value)}
                  className="!py-2 !px-3 text-sm font-display font-bold"
                />
                <input
                  value={`₹${svc.price}`}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value.replace("₹", "")) || 0;
                    updateService(svc.id, "price", v);
                  }}
                  className="!py-2 !px-3 text-sm font-mono"
                />
                <input
                  value={svc.duration}
                  onChange={(e) => updateService(svc.id, "duration", e.target.value)}
                  className="!py-2 !px-3 text-sm"
                />
                <input
                  value={svc.description}
                  onChange={(e) => updateService(svc.id, "description", e.target.value)}
                  className="!py-2 !px-3 text-sm"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => updateService(svc.id, "enabled", !svc.enabled)}
                      className={`text-sm px-3 py-2 rounded-lg transition-all ${
                      svc.enabled
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-secondary text-muted border border-secondary"
                    }`}
                  >
                    {svc.enabled ? "Active" : "Disabled"}
                  </button>
                  <button
                    onClick={() => deleteService(svc.id)}
                    className="text-sm px-3 py-2 rounded-lg bg-booked/20 text-booked border border-booked/30 hover:bg-booked/30 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingLog() {
  const [bookings, setLocalBookings] = useState(() => getBookings() || []);

  const updateStatus = (id, status) => {
    const updated = bookings.map((b) => (b.id === id ? { ...b, status } : b));
    setLocalBookings(updated);
    setBookings(updated);
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <span className="text-4xl">📋</span>
        <p className="mt-3">No bookings yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: card view */}
      <div className="sm:hidden space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="bg-surface/50 border border-secondary rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold text-text-bright text-sm">{b.name}</p>
                <p className="text-xs text-muted">{b.service}</p>
              </div>
              <span
                className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap ${
                  b.status === "confirmed"
                    ? "bg-green-500/20 text-green-400"
                    : b.status === "cancelled"
                    ? "bg-booked/20 text-booked"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {b.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted">Date</span>
                <p className="text-text">{b.date}</p>
              </div>
              <div>
                <span className="text-muted">Time</span>
                <p className="text-text">{b.time}</p>
              </div>
              {b.phone && <div>
                <span className="text-muted">Phone</span>
                <p className="text-text">{b.phone}</p>
              </div>}
            </div>
            <div className="flex gap-2 pt-2 border-t border-line">
              <button
                onClick={() => updateStatus(b.id, "confirmed")}
                className="flex-1 text-[11px] py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-center"
              >
                Confirm
              </button>
              <button
                onClick={() => updateStatus(b.id, "cancelled")}
                className="flex-1 text-[11px] py-2 rounded-lg bg-booked/20 text-booked border border-booked/30 text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop: table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary text-left text-muted text-xs uppercase tracking-wider">
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Phone</th>
              <th className="pb-3 pr-4">Service</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Time</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-secondary text-text">
                <td className="py-3 pr-4">{b.name}</td>
                <td className="py-3 pr-4">{b.phone}</td>
                <td className="py-3 pr-4">{b.service}</td>
                <td className="py-3 pr-4">{b.date}</td>
                <td className="py-3 pr-4">{b.time}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      b.status === "confirmed"
                        ? "bg-green-500/20 text-green-400"
                        : b.status === "cancelled"
                        ? "bg-booked/20 text-booked"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="py-3 flex gap-2">
                  <button
                    onClick={() => updateStatus(b.id, "confirmed")}
                    className="text-xs px-2 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    className="text-xs px-2 py-1 rounded-lg bg-booked/20 text-booked border border-booked/30 hover:bg-booked/30 transition-all"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setLocalSettings] = useState(getSettings() || getDefaultSettings());
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const update = (key, value) => {
    const updated = { ...settings, [key]: value };
    setLocalSettings(updated);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    setPasswordError("");
    const hash = await hashAndStorePassword(newPassword);
    const updated = { ...settings, _passwordHash: hash };
    setLocalSettings(updated);
    setSettings(updated);
    setNewPassword("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) return;
    const hash = await hashAndStorePassword(newUsername);
    const updated = { ...settings, _usernameHash: hash, adminUsername: newUsername };
    setLocalSettings(updated);
    setSettings(updated);
    setNewUsername("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted mb-2">Business Name</label>
        <input value={settings.businessName} onChange={(e) => update("businessName", e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted mb-2">Admin WhatsApp Number (with country code, no +)</label>
        <input value={settings.adminWhatsApp} onChange={(e) => update("adminWhatsApp", e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted mb-2">Admin Username</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={settings.adminUsername || "admin"}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="form-input flex-1"
          />
          <button
            onClick={handleUsernameChange}
            disabled={!newUsername.trim()}
            className="bg-primary text-white font-bold text-sm px-4 py-2 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            Update
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-muted mb-2">Admin Password</label>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            autoComplete="new-password"
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError("");
            }}
            className="form-input flex-1"
          />
          <button
            onClick={handlePasswordChange}
            disabled={!newPassword || newPassword.length < 6}
            className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            Update
          </button>
        </div>
        {passwordError && (
          <p className="text-sm text-booked mt-1">{passwordError}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Working Hours Start</label>
          <input
            type="time"
            value={settings.workingHours?.start || "09:00"}
            onChange={(e) =>
              update("workingHours", { ...settings.workingHours, start: e.target.value })
            }
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Working Hours End</label>
          <input
            type="time"
            value={settings.workingHours?.end || "18:00"}
            onChange={(e) =>
              update("workingHours", { ...settings.workingHours, end: e.target.value })
            }
            className="form-input"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-muted mb-2">Address</label>
        <input value={settings.address || ""} onChange={(e) => update("address", e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted mb-2">Phone</label>
        <input value={settings.phone || ""} onChange={(e) => update("phone", e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted mb-2">Email</label>
        <input value={settings.email || ""} onChange={(e) => update("email", e.target.value)} className="form-input" />
      </div>
      {saved && (
        <p className="text-sm text-green-400">✓ Settings saved</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("slots");

  const tabs = [
    { id: "slots", label: "Slot Management", icon: "📅" },
    { id: "services", label: "Services", icon: "🛠️" },
    { id: "bookings", label: "Bookings", icon: "📋" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <Protected>
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl md:text-3xl font-display font-bold text-gradient">Admin Dashboard</h1>
            <button
              onClick={() => {
                clearAuthSession();
                window.location.href = "/admin";
              }}
              className="text-sm text-muted hover:text-booked transition-all"
            >
              Sign Out
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.id
                    ? "bg-primary text-white font-bold"
                    : "bg-surface/50 text-muted hover:text-text-bright border border-secondary"
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 rounded-xl bg-surface/30 border border-secondary">
            {tab === "slots" && <SlotManager />}
            {tab === "services" && <ServiceManager />}
            {tab === "bookings" && <BookingLog />}
            {tab === "settings" && <SettingsPanel />}
          </div>
        </div>
      </div>
    </Protected>
  );
}
