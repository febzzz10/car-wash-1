const items = [
  "Basic Wash — ₹299",
  "Full Detail — ₹799",
  "Interior Clean — ₹599",
  "Premium Package — ₹1,299",
  "WhatsApp Confirmed Booking",
  "Open Mon–Sat · 8am–7pm",
];

export default function Ticker() {
  return (
    <div className="ticker">
      <div className="ticker__track">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="ticker__item">
            <span className="ticker__dot">●</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
