export default function ServiceCard({ service, index, onToggle }) {
  return (
    <button
      onClick={() => onToggle(service.id)}
      className="service-row w-full text-left"
    >
      <span className="font-mono text-[11px] text-muted">
        {(index + 1).toString().padStart(2, "0")}
      </span>
      <span className="font-display font-bold text-text-bright text-lg">
        {service.name}
      </span>
      <span className="font-mono text-[12px] text-muted">
        {service.duration}
      </span>
      <span className="font-display font-bold text-text-bright text-xl tracking-tight">
        ₹{service.price}
      </span>
      <span className="service-row__arrow text-text-bright text-sm">→</span>
    </button>
  );
}
