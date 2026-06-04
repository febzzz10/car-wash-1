import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import servicesData from "../data/services";
import { getSlots, setSlots, addBooking, getSettings, getServices } from "../utils/storage";
import { generateWhatsAppLink } from "../utils/whatsapp";
import generateTimeSlots from "../data/defaultSlots";

const steps = ["Service", "Date & Time", "Details", "Confirm"];

const formatDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

export default function Booking() {
  const [step, setStep] = useState(0);
  const [services] = useState(() => getServices() || servicesData);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedSlotLabel, setSelectedSlotLabel] = useState("");
  const [details, setDetails] = useState({
    name: "",
    carMake: "",
    carModel: "",
    carPlate: "",
    notes: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!getSlots()) {
      setSlots(generateTimeSlots());
    }
  }, []);

  const daySlots = (() => {
    if (!selectedDate) return [];
    return (getSlots() || []).filter((s) => s.date === selectedDate);
  })();

  const today = new Date().toISOString().split("T")[0];

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const totalPrice = selectedServices.reduce((sum, id) => {
    const svc = services.find((s) => s.id === id);
    return sum + (svc ? svc.price : 0);
  }, 0);

  const canProceed = () => {
    if (step === 0) return selectedServices.length > 0;
    if (step === 1) return selectedDate && selectedSlot;
    if (step === 2) return details.name && details.carMake && details.carModel;
    return true;
  };

  const handleConfirm = () => {
    const settings = getSettings();
    const adminNumber = settings?.adminWhatsApp || "971501234567";
    const serviceNames = selectedServices
      .map((id) => services.find((s) => s.id === id)?.name)
      .join(", ");

    const booking = {
      name: details.name,
      carMake: details.carMake,
      carModel: details.carModel,
      carPlate: details.carPlate,
      service: serviceNames,
      date: formatDate(selectedDate),
      time: selectedSlotLabel,
      notes: details.notes,
    };

    addBooking(booking);
    const link = generateWhatsAppLink(booking, adminNumber);

    const slots = getSlots() || [];
    const updatedSlots = slots.map((s) => {
      if (s.date === selectedDate && s.time === selectedSlot) {
        return { ...s, booked: true };
      }
      return s;
    });
    setSlots(updatedSlots);

    navigate("/confirmation", { state: booking });
    window.open(link, "_blank");
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        <p className="section-number" data-animate>03 / BOOKING</p>
        <h1 className="font-display font-bold text-[clamp(28px,4vw,48px)] text-text mb-12" data-animate>
          Book Your Slot
        </h1>

        {/* Progress Bar */}
        <div className="form-progress mb-12" data-animate>
          <div className="form-progress__fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step 0 - Select Service */}
        {step === 0 && (
          <div data-animate>
            <h2 className="font-mono text-[11px] text-muted tracking-[0.05em] mb-6 uppercase">
              Select Service(s)
            </h2>
            <div className="space-y-px">
              {services.filter((s) => s.enabled).map((service, i) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={i}
                  selected={selectedServices.includes(service.id)}
                  onToggle={toggleService}
                />
              ))}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-8 flex justify-between items-center py-4 border-t border-line">
                <span className="font-mono text-[11px] text-muted tracking-[0.05em]">Total</span>
                <span className="font-display font-bold text-2xl text-text-bright">₹{totalPrice}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 1 - Date & Time */}
        {step === 1 && (
          <div className="space-y-8" data-animate>
            <h2 className="font-mono text-[11px] text-muted tracking-[0.05em] uppercase">
              Select Date & Time
            </h2>
            <div className="form-group relative" onClick={() => {
              const picker = document.getElementById("datePicker");
              if (picker.showPicker) picker.showPicker();
              else picker.click();
            }}>
              <input
                id="datePicker"
                type="date"
                value={selectedDate}
                min={today}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                  setSelectedSlotLabel("");
                }}
                className="sr-only"
              />
              <input
                type="text"
                readOnly
                value={selectedDate ? formatDate(selectedDate) : ""}
                placeholder=" "
                className="form-input cursor-pointer pr-10"
              />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-lg leading-none">
                &#x1F4C5;
              </span>
              <label className="form-label">Date (DD/MM/YYYY)</label>
            </div>
            {selectedDate && (
              <div>
                <p className="font-mono text-[11px] text-muted tracking-[0.05em] mb-4 uppercase">
                  Available Time Slots
                </p>
                {daySlots.length === 0 ? (
                  <p className="font-body text-sm text-muted py-8 text-center">
                    No slots available for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {daySlots.map((slot) => {
                      const taken = !slot.available || slot.booked;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => {
                            if (taken) return;
                            setSelectedSlot(slot.time);
                            setSelectedSlotLabel(slot.label);
                          }}
                          className={`slot text-center ${selectedSlot === slot.time ? "selected" : ""} ${taken ? "booked" : ""}`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2 - Client Details */}
        {step === 2 && (
          <div className="space-y-10" data-animate>
            <h2 className="font-mono text-[11px] text-muted tracking-[0.05em] uppercase">
              Your Details
            </h2>
            <div className="form-group">
              <input
                type="text"
                placeholder=" "
                value={details.name}
                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                className="form-input"
              />
              <label className="form-label">Full Name *</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={details.carMake}
                  onChange={(e) => setDetails({ ...details, carMake: e.target.value })}
                  className="form-input"
                />
                <label className="form-label">Car Make *</label>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder=" "
                  value={details.carModel}
                  onChange={(e) => setDetails({ ...details, carModel: e.target.value })}
                  className="form-input"
                />
                <label className="form-label">Car Model *</label>
              </div>
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder=" "
                value={details.carPlate}
                onChange={(e) => setDetails({ ...details, carPlate: e.target.value })}
                className="form-input"
              />
              <label className="form-label">Plate Number</label>
            </div>
            <div className="form-group">
              <textarea
                rows={3}
                placeholder=" "
                value={details.notes}
                onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                className="form-input"
              />
              <label className="form-label">Special Notes</label>
            </div>
          </div>
        )}

        {/* Step 3 - Confirm */}
        {step === 3 && (
          <div className="space-y-8" data-animate>
            <h2 className="font-mono text-[11px] text-muted tracking-[0.05em] uppercase">
              Review Your Booking
            </h2>
            <div className="bg-surface p-6 md:p-8 border border-line space-y-6">
              {[
                { label: "Service", value: selectedServices.map((id) => services.find((s) => s.id === id)?.name).join(", ") },
                { label: "Date", value: formatDate(selectedDate) },
                { label: "Time", value: selectedSlotLabel },
                { label: "Name", value: details.name },
                { label: "Car", value: `${details.carMake} ${details.carModel}${details.carPlate ? ` (${details.carPlate})` : ""}` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="font-mono text-[11px] text-muted tracking-[0.05em] uppercase">{item.label}</span>
                  <span className="font-body text-sm text-text text-right">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t border-line">
                <span className="font-mono text-[11px] text-muted tracking-[0.05em] uppercase">Total</span>
                <span className="font-display font-bold text-2xl text-text-bright">₹{totalPrice}</span>
              </div>
            </div>
            <p className="font-body text-sm text-muted text-center">
              By confirming, you'll be redirected to WhatsApp to send us your booking details.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-12 gap-4" data-animate>
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="font-mono text-[12px] text-muted hover:text-text-bright transition-colors tracking-[0.05em] uppercase"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          <div className="flex-1 md:flex-none">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="btn-primary w-full md:w-auto disabled:opacity-25 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            ) : (
              <button onClick={handleConfirm} className="btn-whatsapp w-full md:w-auto">
                Confirm via WhatsApp →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
