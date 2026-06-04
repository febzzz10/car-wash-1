import { Link, useLocation } from "react-router-dom";

export default function Confirmation() {
  const location = useLocation();
  const booking = location.state;

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-md mx-auto px-4 text-center">
          <span className="text-6xl">🤔</span>
          <h1 className="text-2xl font-display font-bold mt-4 mb-4">No Booking Found</h1>
          <p className="text-muted mb-6">
            It looks like you haven't made a booking yet.
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3"
          >
            Book Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-whatsapp/10 border border-whatsapp/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
          Booking Received! 🎉
        </h1>
        <p className="text-muted mb-8">
          Your booking has been sent to us via WhatsApp. You'll receive a
          confirmation reply shortly.
        </p>

        <div className="p-6 rounded-xl bg-surface/50 border border-secondary text-left space-y-4 mb-8">
          <div>
            <span className="text-xs text-muted uppercase tracking-wider">Service</span>
            <p className="font-medium mt-1">{booking.service}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted uppercase tracking-wider">Date</span>
              <p className="font-medium mt-1">{booking.date}</p>
            </div>
            <div>
              <span className="text-xs text-muted uppercase tracking-wider">Time</span>
              <p className="font-medium mt-1">{booking.time}</p>
            </div>
          </div>
          <div>
              <span className="text-xs text-muted uppercase tracking-wider">Name</span>
            <p className="font-medium mt-1">{booking.name}</p>
          </div>
          <div>
              <span className="text-xs text-muted uppercase tracking-wider">Car</span>
            <p className="font-medium mt-1">
              {booking.carMake} {booking.carModel}
              {booking.carPlate ? ` (${booking.carPlate})` : ""}
            </p>
          </div>
        </div>

        <Link
          to="/booking"
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 hover:bg-primary/90 transition-all"
        >
          Book Another
        </Link>
      </div>
    </div>
  );
}
