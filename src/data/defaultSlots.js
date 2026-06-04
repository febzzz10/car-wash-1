function generateTimeSlots() {
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
    times.forEach((t) => {
      slots.push({
        id: `${dateStr}-${t.value}`,
        date: dateStr,
        time: t.value,
        label: t.label,
        available: true,
        booked: false,
      });
    });
  }
  return slots;
}

export default generateTimeSlots;
