import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ScrollProgress";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Confirmation from "./pages/Confirmation";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { useEffect } from "react";
import { initStorage } from "./utils/storage";

export default function App() {
  useEffect(() => {
    initStorage();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    const applyStagger = (parent) => {
      const children = parent.querySelectorAll(":scope > [data-animate]:not(.in-view)");
      children.forEach((el, i) => {
        el.style.setProperty("--stagger", i * 120);
      });
    };

    const observe = () => {
      const els = document.querySelectorAll("[data-animate]:not(.in-view)");
      els.forEach((el) => {
        applyStagger(el.parentElement);
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("in-view");
        } else {
          io.observe(el);
        }
      });
    };

    observe();

    const mo = new MutationObserver(observe);
    mo.observe(document.getElementById("root"), { subtree: true, childList: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
        <ScrollProgress />
      </div>
    </BrowserRouter>
  );
}
