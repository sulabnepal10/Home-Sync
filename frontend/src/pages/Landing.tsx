import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFonts } from '@/hooks/useFonts';
import {
  Home,
  Wallet,
  ArrowLeftRight,
  CheckSquare,
  UtensilsCrossed,
  Package,
  Shield,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';


/* ─── DATA ─── */
const features = [
  {
    icon: Wallet,
    title: 'Shared Expenses',
    description: 'Track and split costs fairly. No more end-of-month guesswork.',
    tag: '01',
    accent: '#C84B31',
  },
  {
    icon: ArrowLeftRight,
    title: 'Loan Tracking',
    description: 'Keep tabs on who owes whom with smart settlement hints.',
    tag: '02',
    accent: '#2C6E49',
  },
  {
    icon: CheckSquare,
    title: 'Chore Rotation',
    description: 'Gamified task assignments — streaks keep everyone honest.',
    tag: '03',
    accent: '#C84B31',
  },
  {
    icon: UtensilsCrossed,
    title: 'Meal Planning',
    description: 'Coordinate kitchen schedules and cook together more often.',
    tag: '04',
    accent: '#2C6E49',
  },
  {
    icon: Package,
    title: 'House Inventory',
    description: 'Track groceries and supplies. Low-stock alerts built in.',
    tag: '05',
    accent: '#C84B31',
  },
  {
    icon: Shield,
    title: 'Transparent Records',
    description: 'Every transaction logged. Disputes become a thing of the past.',
    tag: '06',
    accent: '#2C6E49',
  },
];

const stats = [
  { label: 'Happy Households', value: '3+' },
  { label: 'Expenses Tracked', value: '20+' },
  { label: 'Chores Completed', value: '20+' },
  { label: 'Meals Shared', value: '50+' },
];

/* ─── GRAIN OVERLAY (CSS-only SVG) ─── */
const grainSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.07'/%3E%3C/svg%3E")`;

/* ─── INLINE STYLES (no Tailwind dependency for custom stuff) ─── */
const css = `
  :root {
    /* Aliased to the shared --hs-* variables (src/index.css) so this page's
       colors invert under dark mode instead of duplicating the palette. */
    --cream:  hsl(var(--hs-cream));
    --tan:    hsl(var(--hs-tan));
    --bark:   hsl(var(--hs-bark));
    --rust:   hsl(var(--hs-rust));
    --olive:  hsl(var(--hs-olive));
    --sand:   hsl(var(--hs-sand));
    --ink:    hsl(var(--hs-ink));
    --muted:  hsl(var(--hs-muted));
    --ff-display: 'Playfair Display', Georgia, serif;
    --ff-mono:    'DM Mono', 'Courier New', monospace;
    --ff-body:    'DM Sans', system-ui, sans-serif;
  }

  .hs-root {
    font-family: var(--ff-body);
    background-color: var(--cream);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* grain overlay on everything */
  .hs-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: ${grainSvg};
    background-repeat: repeat;
    pointer-events: none;
    z-index: 999;
    opacity: 0.4;
  }

  /* ── NAV ── */
  .hs-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    background: rgba(245, 240, 232, 0.88);
    backdrop-filter: blur(14px);
    border-bottom: 1.5px solid var(--sand);
    font-family: var(--ff-mono);
  }
  .hs-nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .hs-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--ink);
  }
  .hs-logo-mark {
    width: 36px; height: 36px;
    background: var(--rust);
    display: flex; align-items: center; justify-content: center;
    transform: rotate(-3deg);
  }
  .hs-logo-text {
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 500;
  }
  .hs-nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0; padding: 0;
  }
  .hs-nav-links a {
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .hs-nav-links a:hover { color: var(--ink); }
  .hs-nav-cta {
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: var(--ink);
    color: var(--cream);
    border: none;
    padding: 10px 22px;
    cursor: pointer;
    font-family: var(--ff-mono);
    font-weight: 500;
    transition: background 0.2s, transform 0.15s;
  }
  .hs-nav-cta:hover { background: var(--rust); transform: translateY(-1px); }

  /* ── HERO ── */
  .hs-hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 120px 2rem 80px;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
  }
  .hs-hero-eyebrow {
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--rust);
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 2rem;
  }
  .hs-hero-eyebrow::before {
    content: '';
    display: block;
    width: 40px;
    height: 1.5px;
    background: var(--rust);
  }
  .hs-hero-h1 {
    font-family: var(--ff-display);
    font-size: clamp(3.5rem, 8vw, 7.5rem);
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -0.02em;
    color: var(--ink);
    margin: 0 0 0.2em;
    max-width: 14ch;
  }
  .hs-hero-h1 em {
    font-style: italic;
    color: var(--rust);
  }
  .hs-hero-sub {
    font-size: 1.1rem;
    color: var(--muted);
    max-width: 42ch;
    line-height: 1.65;
    margin: 1.5rem 0 2.5rem;
  }
  .hs-hero-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .hs-btn-primary {
    font-family: var(--ff-mono);
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: var(--rust);
    color: #fff;
    border: 2px solid var(--rust);
    padding: 14px 28px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: background 0.2s, transform 0.15s;
    font-weight: 500;
  }
  .hs-btn-primary:hover { background: var(--bark); border-color: var(--bark); transform: translateY(-2px); }
  .hs-btn-ghost {
    font-family: var(--ff-mono);
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: transparent;
    color: var(--ink);
    border: 2px solid var(--sand);
    padding: 14px 28px;
    cursor: pointer;
    transition: border-color 0.2s, transform 0.15s;
    font-weight: 500;
  }
  .hs-btn-ghost:hover { border-color: var(--ink); transform: translateY(-2px); }

  /* big decorative stamp */
  .hs-hero-stamp {
    position: absolute;
    right: 4%;
    top: 50%;
    transform: translateY(-50%) rotate(12deg);
    width: clamp(180px, 22vw, 300px);
    height: clamp(180px, 22vw, 300px);
    border: 3px solid var(--sand);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    opacity: 0.6;
    pointer-events: none;
  }
  .hs-hero-stamp svg {
    width: 40%;
    height: 40%;
    opacity: 0.5;
  }
  .hs-hero-stamp-text {
    font-family: var(--ff-mono);
    font-size: 10px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--muted);
    text-align: center;
    padding: 0 20%;
    line-height: 1.6;
  }

  /* ── MARQUEE STRIP ── */
  .hs-strip {
    background: var(--ink);
    color: var(--cream);
    padding: 14px 0;
    overflow: hidden;
    border-top: 2px solid var(--rust);
    border-bottom: 2px solid var(--rust);
    white-space: nowrap;
  }
  .hs-strip-track {
    display: inline-flex;
    gap: 0;
    animation: marquee 28s linear infinite;
  }
  .hs-strip-item {
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 0 2.5rem;
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    color: var(--tan);
  }
  .hs-strip-dot {
    width: 5px; height: 5px;
    background: var(--rust);
    border-radius: 50%;
    flex-shrink: 0;
  }
  @keyframes marquee {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* ── STATS ── */
  .hs-stats {
    background: var(--tan);
    border-bottom: 1.5px solid var(--sand);
  }
  .hs-stats-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-left: 1.5px solid var(--sand);
  }
  .hs-stat {
    padding: 3rem 2rem;
    border-right: 1.5px solid var(--sand);
    border-top: 0;
  }
  .hs-stat-val {
    font-family: var(--ff-display);
    font-size: clamp(2rem, 4vw, 3.2rem);
    font-weight: 900;
    color: var(--rust);
    line-height: 1;
    margin-bottom: 6px;
  }
  .hs-stat-label {
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* ── FEATURES ── */
  .hs-features {
    max-width: 1200px;
    margin: 0 auto;
    padding: 6rem 2rem;
  }
  .hs-section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 4rem;
    gap: 2rem;
    flex-wrap: wrap;
  }
  .hs-section-kicker {
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--rust);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .hs-section-kicker::before {
    content: '';
    display: block;
    width: 30px;
    height: 1.5px;
    background: var(--rust);
  }
  .hs-section-h2 {
    font-family: var(--ff-display);
    font-size: clamp(2.2rem, 4vw, 3.5rem);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: var(--ink);
    margin: 0;
  }
  .hs-section-h2 em {
    font-style: italic;
    color: var(--rust);
  }
  .hs-section-desc {
    font-size: 1rem;
    color: var(--muted);
    line-height: 1.7;
    max-width: 36ch;
    margin: 0;
  }
  .hs-feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1.5px solid var(--sand);
    border-left: 1.5px solid var(--sand);
  }
  .hs-feature-card {
    padding: 2.5rem 2rem;
    border-right: 1.5px solid var(--sand);
    border-bottom: 1.5px solid var(--sand);
    position: relative;
    background: var(--cream);
    transition: background 0.25s;
    cursor: default;
  }
  .hs-feature-card:hover {
    background: var(--tan);
  }
  .hs-feature-tag {
    font-family: var(--ff-mono);
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.12em;
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
  }
  .hs-feature-icon {
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1.25rem;
    background: transparent;
    border: 1.5px solid currentColor;
    transition: transform 0.25s;
  }
  .hs-feature-card:hover .hs-feature-icon {
    transform: rotate(-6deg);
  }
  .hs-feature-title {
    font-family: var(--ff-display);
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 0.6rem;
  }
  .hs-feature-desc {
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.65;
    margin: 0;
  }

  /* ── HOW IT WORKS ── */
  .hs-how {
    background: var(--ink);
    color: var(--cream);
    padding: 6rem 2rem;
  }
  .hs-how-inner {
    max-width: 1200px;
    margin: 0 auto;
  }
  .hs-how .hs-section-kicker { color: var(--rust); }
  .hs-how .hs-section-kicker::before { background: var(--rust); }
  .hs-how .hs-section-h2 { color: var(--cream); }
  .hs-how .hs-section-h2 em { color: var(--rust); }
  .hs-steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    margin-top: 4rem;
    border-top: 1px solid rgba(212,184,150,0.2);
  }
  .hs-step {
    padding: 2.5rem 2rem;
    border-right: 1px solid rgba(212,184,150,0.2);
    position: relative;
  }
  .hs-step:last-child { border-right: none; }
  .hs-step-num {
    font-family: var(--ff-display);
    font-size: 5rem;
    font-weight: 900;
    color: var(--rust);
    opacity: 0.25;
    line-height: 1;
    margin-bottom: 1rem;
  }
  .hs-step-title {
    font-family: var(--ff-display);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 0.75rem;
  }
  .hs-step-desc {
    font-size: 0.9rem;
    color: rgba(245,240,232,0.55);
    line-height: 1.7;
  }
  .hs-step-arrow {
    position: absolute;
    top: 2.5rem;
    right: -14px;
    z-index: 1;
    color: var(--rust);
    opacity: 0.6;
  }
  .hs-step:last-child .hs-step-arrow { display: none; }

  /* ── BIG CTA ── */
  .hs-cta-section {
    padding: 6rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  .hs-cta-box {
    background: var(--rust);
    padding: 5rem 4rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 3rem;
    flex-wrap: wrap;
    position: relative;
    overflow: hidden;
  }
  .hs-cta-box::before {
    content: 'HomeSync';
    position: absolute;
    right: -2%;
    bottom: -15%;
    font-family: var(--ff-display);
    font-size: 15vw;
    font-weight: 900;
    color: rgba(0,0,0,0.08);
    letter-spacing: -0.04em;
    pointer-events: none;
    white-space: nowrap;
    line-height: 1;
  }
  .hs-cta-left { position: relative; z-index: 1; }
  .hs-cta-kicker {
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.65);
    margin-bottom: 1rem;
    display: flex; align-items: center; gap: 10px;
  }
  .hs-cta-kicker::before {
    content: '';
    display: block;
    width: 24px; height: 1.5px;
    background: rgba(255,255,255,0.5);
  }
  .hs-cta-h2 {
    font-family: var(--ff-display);
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 900;
    color: #fff;
    line-height: 1.05;
    margin: 0;
  }
  .hs-cta-right { position: relative; z-index: 1; }
  .hs-btn-white {
    font-family: var(--ff-mono);
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: #fff;
    color: var(--rust);
    border: 2px solid #fff;
    padding: 16px 32px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
    font-weight: 500;
    transition: background 0.2s, color 0.2s, transform 0.15s;
  }
  .hs-btn-white:hover { background: var(--ink); color: #fff; border-color: var(--ink); transform: translateY(-2px); }

  /* ── FOOTER ── */
  .hs-footer {
    background: var(--bark);
    color: var(--tan);
    padding: 2.5rem 2rem;
    border-top: 2px solid var(--rust);
  }
  .hs-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  .hs-footer-copy {
    font-family: var(--ff-mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--sand);
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .hs-stats-inner { grid-template-columns: repeat(2, 1fr); }
    .hs-feature-grid { grid-template-columns: repeat(2, 1fr); }
    .hs-steps { grid-template-columns: 1fr; }
    .hs-step { border-right: none; border-bottom: 1px solid rgba(212,184,150,0.2); }
    .hs-step-arrow { display: none; }
    .hs-hero-stamp { display: none; }
  }
  @media (max-width: 600px) {
    .hs-feature-grid { grid-template-columns: 1fr; }
    .hs-stats-inner { grid-template-columns: repeat(2, 1fr); }
    .hs-cta-box { padding: 3rem 2rem; }
    .hs-nav-links { display: none; }
  }
`;

/* ─── MARQUEE ITEMS ─── */
const marqueeItems = [
  'Shared Living',
  'Expense Splits',
  'Chore Charts',
  'Meal Planning',
  'House Inventory',
  'Loan Tracking',
  'Happy Roommates',
];

export default function Landing() {
  useFonts();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const stampRotate = useTransform(scrollYProgress, [0, 1], [12, 30]);
  const stampScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.12]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="hs-root" ref={containerRef}>

        {/* ── NAV ── */}
        <header className="hs-nav">
          <div className="hs-nav-inner">
            <a href="/" className="hs-logo">
              <div className="hs-logo-mark">
                <Home size={16} color="#fff" />
              </div>
              <span className="hs-logo-text">HomeSync</span>
            </a>
            <ul className="hs-nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How it works</a></li>
            </ul>
            <button className="hs-nav-cta" onClick={() => navigate('/auth')}>
              Get Started →
            </button>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="hs-hero">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="hs-hero-eyebrow">A personal project — shared living made easy</div>
          </motion.div>

          <motion.h1
            className="hs-hero-h1"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            Your home,<br /><em>in sync.</em>
          </motion.h1>

          <motion.p
            className="hs-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
          >
            Expenses, chores, meals, and shared supplies — all in one place.
            Built for households that actually want to get along.
          </motion.p>

          <motion.div
            className="hs-hero-actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
          >
            <button className="hs-btn-primary" onClick={() => navigate('/auth')}>
              Start for free
              <ArrowRight size={15} />
            </button>
            <button
              className="hs-btn-ghost"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore features
            </button>
          </motion.div>

          {/* decorative stamp */}
          <motion.div
            className="hs-hero-stamp"
            style={{ rotate: stampRotate, scale: stampScale }}
          >
            <Home size={64} strokeWidth={1} color="var(--sand)" />
            <p className="hs-hero-stamp-text">
              — Built with care —
            </p>
          </motion.div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="hs-strip">
          <div className="hs-strip-track" aria-hidden>
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span className="hs-strip-item" key={i}>
                <span className="hs-strip-dot" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="hs-stats">
          <div className="hs-stats-inner">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="hs-stat"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="hs-stat-val">{s.value}</div>
                <div className="hs-stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features" className="hs-features">
          <div className="hs-section-header">
            <div>
              <div className="hs-section-kicker">What's inside</div>
              <h2 className="hs-section-h2">
                Everything a<br />household <em>needs</em>
              </h2>
            </div>
            <p className="hs-section-desc">
              No more messy spreadsheets or passive-aggressive sticky notes.
              HomeSync keeps everyone on the same page.
            </p>
          </div>

          <div className="hs-feature-grid">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="hs-feature-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
              >
                <span className="hs-feature-tag">{f.tag}</span>
                <div className="hs-feature-icon" style={{ color: f.accent, borderColor: f.accent }}>
                  <f.icon size={20} color={f.accent} />
                </div>
                <h3 className="hs-feature-title">{f.title}</h3>
                <p className="hs-feature-desc">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" className="hs-how">
          <div className="hs-how-inner">
            <div className="hs-section-header">
              <div>
                <div className="hs-section-kicker">Getting started</div>
                <h2 className="hs-section-h2">Up and running<br /><em>in minutes</em></h2>
              </div>
            </div>

            <div className="hs-steps">
              {[
                {
                  n: '01',
                  title: 'Create your household',
                  desc: 'Sign up, name your space, and invite your roommates with a single link.',
                },
                {
                  n: '02',
                  title: 'Set up what matters',
                  desc: 'Add expenses, assign chores, and plan meals — configure just the features you actually need.',
                },
                {
                  n: '03',
                  title: 'Live in harmony',
                  desc: 'Everything stays in sync. Alerts and summaries keep everyone accountable, effortlessly.',
                },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  className="hs-step"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                >
                  <div className="hs-step-num">{step.n}</div>
                  <div className="hs-step-title">{step.title}</div>
                  <p className="hs-step-desc">{step.desc}</p>
                  <span className="hs-step-arrow">
                    <ArrowRight size={20} />
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="hs-cta-section">
          <motion.div
            className="hs-cta-box"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="hs-cta-left">
              <div className="hs-cta-kicker">Ready to try it?</div>
              <h2 className="hs-cta-h2">
                Make shared living<br />actually enjoyable.
              </h2>
            </div>
            <div className="hs-cta-right">
              <button className="hs-btn-white" onClick={() => navigate('/auth')}>
                Get started — it's free
                <ArrowUpRight size={15} />
              </button>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="hs-footer">
          <div className="hs-footer-inner">
            <div className="hs-logo" style={{ color: 'var(--tan)' }}>
              <div className="hs-logo-mark" style={{ background: 'var(--rust)' }}>
                <Home size={16} color="#fff" />
              </div>
              <span className="hs-logo-text" style={{ color: 'var(--tan)' }}>HomeSync</span>
            </div>
            <p className="hs-footer-copy">A personal project — made with care for roommates everywhere</p>
          </div>
        </footer>

      </div>
    </>
  );
}