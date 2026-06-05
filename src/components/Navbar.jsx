import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const nav = document.querySelector(".navbar");
    if (!nav) return;

    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("scrolled", y > 80);
      nav.classList.toggle("hidden", y > lastY && y > 200);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isActive = (path) =>
    location.pathname === path
      ? "text-text-bright after:scale-x-100"
      : "text-muted hover:text-text-bright";

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-text-bright">
          <span className="text-muted">Grey</span> Goosee
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`relative text-sm font-body font-medium transition-colors duration-[var(--dur-fast)] footer-link ${isActive("/")}`}
          >
            Home
          </Link>
          <Link
            to="/booking"
            className={`relative text-sm font-body font-medium transition-colors duration-[var(--dur-fast)] footer-link ${isActive("/booking")}`}
          >
            Book Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden relative w-8 h-8 flex items-center justify-center"
          aria-label="Toggle menu"
        >
          <span className={`block absolute h-[2px] w-5 bg-text-bright transition-all duration-[var(--dur-base)] ${menuOpen ? "rotate-45" : "-translate-y-[6px]"}`} />
          <span className={`block absolute h-[2px] w-5 bg-text-bright transition-all duration-[var(--dur-base)] ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block absolute h-[2px] w-5 bg-text-bright transition-all duration-[var(--dur-base)] ${menuOpen ? "-rotate-45" : "translate-y-[6px]"}`} />
        </button>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`md:hidden fixed inset-0 top-16 z-40 bg-bg/98 backdrop-blur-lg transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] ${
          menuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-10 h-full">
          {/* Book Now link removed from mobile per request */}
        </div>
      </div>
    </nav>
  );
}
