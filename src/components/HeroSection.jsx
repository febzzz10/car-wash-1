import { Link } from "react-router-dom";
import Ticker from "./Ticker";
import styles from "../styles/HeroSection.module.css";

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.grid} />

      <div className={styles.inner}>
        <div className={styles.heroContent}>
          <p className={styles.label}>SPEC 00 / HERO</p>
          <h1 className={styles.title}>
            AB
            <span className={styles.titleAccent}>Washing</span>
          </h1>
          <p className={styles.subtitle}>
            Precision hand-wash and ceramic protection at your doorstep.
            Engineered for — not just cleaned.
          </p>

          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>Starting from</span>
            <span className={styles.priceValue}>₹299</span>
            <span className={styles.priceCents}>/ wash</span>
          </div>

          <Link to="/booking" className={styles.cta}>
            Book Your Wash Now →
          </Link>

          <div className={styles.stats}>
            <span className={styles.statItem}>
              <span className={styles.statDot} />4.9 ★
            </span>
            <span className={styles.statItem}>
              <span className={styles.statDot} />500+ Cars
            </span>
            <span className={styles.statItem}>
              <span className={styles.statDot} />Since 2018
            </span>
          </div>
        </div>
      </div>

      <Ticker />
    </section>
  );
}
