import { Link } from "react-router-dom";
import ServiceCard from "../components/ServiceCard";
import Ticker from "../components/Ticker";
import servicesData from "../data/services";
import { getServices, getSettings, getDefaultSettings } from "../utils/storage";
import bmwBg from "../assets/bmw1.webp";
import bmwMobileBg from "../assets/bmw-mobile.webp";

export default function Home() {

  const services = getServices() || servicesData;
  const settings = getSettings() || getDefaultSettings();
  const wh = settings.workingHours || { start: "09:00", end: "18:00" };
  const fmt = (t) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return hour > 12 ? `${hour - 12}:${m} PM` : hour === 12 ? `12:${m} PM` : `${hour}:${m} AM`;
  };

  return (
    <div>
      {/* 00 / HERO */}
      <section
        className="hero min-h-screen flex items-center relative overflow-hidden pt-4"
      >
        {/* Full-screen background */}
        <div className="hero-bg" aria-hidden="true" style={{ '--mobile-bg': `url(${bmwMobileBg})` }}>
          <div className="hero-bg__image" style={{ backgroundImage: `url(${bmwBg})` }} />
          <div className="hero-bg__overlay" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none bg-grid" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <h1 className="hero__title font-display font-extrabold text-[clamp(36px,8vw,96px)] leading-[1.05] text-text-bright mb-6" data-animate>
            <span className="line-mask" style={{ '--stagger': 0 }}><span>Grey</span></span>
            <span className="line-mask" style={{ '--stagger': 1 }}><span className="text-primary">Goosee</span></span>
          </h1>
          <p className="hero__sub font-body text-lg text-muted max-w-xl mb-10" data-animate>
            Our express wash makes car cleaning effortless. at your Home, relax and drive out
            with a sparking clean car.
          </p>
          <Link
            to="/booking"
            className="hero__cta btn-primary inline-flex"
            data-animate
          >
            Book Your Wash Now →
          </Link>
          <div className="hero__rule hairline mt-12 w-full max-w-xl" />
        </div>
        <div className="absolute bottom-20 left-0 right-0">
          <Ticker />
        </div>
      </section>

      {/* 01 / SERVICES */}
      <section className="py-24" id="services">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="section-number" data-animate>01 / SERVICES</p>
          <h2 className="font-display font-bold text-[clamp(28px,4vw,48px)] text-text mb-16" data-animate>
            Choose Your Service
          </h2>
          <div data-animate>
            {services.filter((s) => s.enabled).map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} selected={false} onToggle={() => {}} />
            ))}
          </div>
        </div>
      </section>

      {/* 02 / HOW IT WORKS */}
      <section className="py-24" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="section-number" data-animate>02 / HOW IT WORKS</p>
          <h2 className="font-display font-bold text-[clamp(28px,4vw,48px)] text-text mb-16" data-animate>
            Three Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              { num: "01", title: "Select Service", desc: "Pick the service that fits your needs. Basic to premium." },
              { num: "02", title: "Book Your Slot", desc: "Choose your preferred date and available time slot." },
              { num: "03", title: "Admin Confirms", desc: "Receive WhatsApp confirmation from us." },
            ].map((step, i) => (
              <div key={i} className="step" data-animate>
                <span className="font-mono text-[clamp(36px,5vw,56px)] font-bold text-text-bright/10 block leading-none mb-4">
                  {step.num}
                </span>
                <h3 className="font-display font-bold text-xl text-text-bright mb-3">{step.title}</h3>
                <p className="font-body text-muted leading-relaxed">{step.desc}</p>
                {i < 2 && <div className="step-connector hidden md:block mt-8 w-full" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03 / REVIEWS */}
      <section className="py-24" id="reviews">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="section-number" data-animate>03 / REVIEWS</p>
          <h2 className="font-display font-bold text-[clamp(28px,4vw,48px)] text-text mb-16" data-animate>
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Ahmed K.", text: "Best car wash in town! My car looks brand new every time." },
              { name: "Sarah M.", text: "The booking process was so easy. Highly recommend!" },
              { name: "Rashid A.", text: "Professional service and great attention to detail." },
            ].map((t, i) => (
              <div key={i} className="bg-surface p-8 border border-line" data-animate>
                <span className="text-4xl text-primary block mb-4">"</span>
                <p className="font-body text-text leading-relaxed mb-6">{t.text}</p>
                <span className="font-mono text-[11px] text-muted tracking-[0.05em]">— {t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 / PRICING */}
      <section className="py-24" id="pricing">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="section-number" data-animate>04 / PRICING</p>
          <h2 className="font-display font-bold text-[clamp(28px,4vw,48px)] text-text mb-16" data-animate>
            Transparent Pricing
          </h2>
          <PricingCarousel services={services.filter((s) => s.enabled).slice(0, 3)} />
        </div>
      </section>

      {/* 05 / ABOUT */}
      <section className="py-24" id="about">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <p className="section-number" data-animate>05 / ABOUT</p>
          <div className="about" data-animate>
            <p className="font-body text-xl md:text-2xl text-text leading-relaxed">
              We've been hand-washing cars in Dubai since 2018. No automated tunnels.
              No shortcuts. Every slot is personal, every booking is confirmed by a human.
            </p>
          </div>
        </div>
      </section>

      {/* 06 / CONTACT */}
      <section className="py-24" id="contact">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <p className="section-number" data-animate>06 / REACH</p>
          <h2 className="font-display font-bold text-[clamp(28px,4vw,48px)] text-text mb-6" data-animate>
            Book Your Slot Today
          </h2>
          <p className="font-body text-lg text-muted mb-10" data-animate>
            {settings.address || "123 Auto Street, Dubai"} &middot; {settings.phone || "+971 50 123 4567"} &middot; {settings.email || "info@premiumcarwash.com"}
            <br />
            Mon-Sat: {fmt(wh.start)} – {fmt(wh.end)}
          </p>
          <a
            href={`https://wa.me/${settings.adminWhatsApp || "971501234567"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex cta-whatsapp"
            data-animate
          >
            Book via WhatsApp →
          </a>
        </div>
      </section>
    </div>
  );
}

function PricingCarousel({ services }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {services.map((svc, i) => (
        <div
          key={svc.id}
          className={`bg-surface p-5 border border-line ${i === 1 ? "featured" : ""}`}
          data-animate
        >
          <span className="font-mono text-[9px] text-muted tracking-[0.05em]">
            {svc.duration}
          </span>
          <h3 className="font-display font-bold text-sm md:text-2xl text-text-bright mt-2 mb-1">{svc.name}</h3>
          <p className="font-display font-bold text-base md:text-[32px] text-text-bright mb-2">₹{svc.price}</p>
          <p className="font-body text-[11px] md:text-sm text-muted leading-relaxed mb-3 line-clamp-1 md:line-clamp-2">{svc.description}</p>
          <Link
            to="/booking"
          >
            Book Now →
          </Link>
        </div>
      ))}
    </div>
  );

}
