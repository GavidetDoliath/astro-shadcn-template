import { useEffect, useRef, useState } from 'react';

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <style>{`
        .hero {
          position: relative;
          width: 100%;
          height: 100svh;
          min-height: 600px;
          overflow: hidden;
          background: var(--noir);
          cursor: default;
        }

        /* Clean light background - no overlays needed */

        /* CONTENT */
        .hero__content {
          position: relative;
          z-index: 10;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: clamp(2rem, 6vw, 5rem) clamp(1.5rem, 8vw, 8rem);
        }

        .hero__label {
          font-family: var(--font-mono);
          font-size: clamp(0.6rem, 1vw, 0.75rem);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--rouille);
          margin-bottom: clamp(1.5rem, 3vh, 2.5rem);
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s;
        }

        .hero__label.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero__rule {
          width: 3rem;
          height: 2px;
          background: var(--sang);
          margin-bottom: 1.25rem;
          opacity: 0;
          transform: scaleX(0);
          transform-origin: left;
          transition: opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s;
        }
        .hero__rule.visible {
          opacity: 1;
          transform: scaleX(1);
        }

        .hero__title {
          font-family: var(--font-serif);
          font-weight: 900;
          line-height: 0.92;
          color: var(--parchemin);
          margin-bottom: clamp(1.5rem, 3vh, 2.5rem);
          max-width: 100%;
        }

        .hero__title-line {
          display: block;
          overflow: hidden;
        }

        .hero__title-inner {
          display: block;
          font-size: clamp(3rem, 9vw, 9rem);
          opacity: 0;
          transform: translateY(105%);
          transition: opacity 0.01s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero__title-inner.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .hero__title-inner--delay1 { transition-delay: 0.6s; }
        .hero__title-inner--delay2 { transition-delay: 0.75s; }
        .hero__title-inner--italic {
          font-style: italic;
          color: var(--beige-pali);
          font-size: clamp(2.2rem, 6.5vw, 6.5rem);
        }

        .hero__tagline {
          font-family: var(--font-body);
          font-style: italic;
          font-size: clamp(0.95rem, 1.8vw, 1.35rem);
          color: var(--beige-pali);
          max-width: 40ch;
          line-height: 1.5;
          margin-bottom: clamp(2rem, 4vh, 3.5rem);
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 1s ease 1.1s, transform 1s ease 1.1s;
        }
        .hero__tagline.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hero__cta-group {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.8s ease 1.4s, transform 0.8s ease 1.4s;
        }
        .hero__cta-group.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .btn-primary {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--noir);
          background: var(--parchemin);
          border: none;
          padding: 0.9rem 2rem;
          cursor: pointer;
          position: relative;
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 100%;
          height: 100%;
          border: 1px solid var(--sang);
          transition: transform 0.2s;
        }
        .btn-primary:hover {
          background: var(--sang);
          color: var(--parchemin);
        }
        .btn-primary:hover::after {
          transform: translate(3px, 3px);
        }

        .btn-ghost {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--beige-pali);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.9rem 0;
          border-bottom: 1px solid rgba(212,201,176,0.3);
          transition: border-color 0.2s, color 0.2s;
          text-decoration: none;
        }
        .btn-ghost:hover {
          color: var(--parchemin);
          border-color: var(--parchemin);
        }

        .hero__scroll {
          position: absolute;
          right: clamp(1.5rem, 4vw, 3rem);
          bottom: clamp(2rem, 5vh, 4rem);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.8s ease 2s;
        }
        .hero__scroll.visible { opacity: 1; }
        .hero__scroll-text {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--muted-foreground);
          writing-mode: vertical-rl;
        }
        .hero__scroll-line {
          width: 1px;
          height: 3rem;
          background: linear-gradient(to bottom, var(--sang), transparent);
          animation: scrollPulse 2s ease-in-out infinite;
        }
        @keyframes scrollPulse {
          0%, 100% { transform: scaleY(1); opacity: 0.6; }
          50% { transform: scaleY(0.6); opacity: 0.2; }
        }

        .hero__issue {
          position: absolute;
          top: clamp(1.5rem, 4vh, 3rem);
          right: clamp(1.5rem, 4vw, 3rem);
          z-index: 10;
          font-family: var(--font-sans);
          font-weight: 900;
          font-size: clamp(5rem, 18vw, 18rem);
          color: rgba(0, 0, 0, 0.03);
          line-height: 1;
          user-select: none;
          pointer-events: none;
        }

        .hero__nav {
          position: absolute;
          top: clamp(1.5rem, 4vh, 3rem);
          left: clamp(1.5rem, 8vw, 8rem);
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 2.5rem;
          opacity: 0;
          transform: translateY(-8px);
          transition: opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s;
        }
        .hero__nav.visible { opacity: 1; transform: translateY(0); }

        .hero__logo {
          font-family: var(--font-serif);
          font-size: 0.95rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--parchemin);
          text-decoration: none;
        }
        .hero__logo span {
          color: var(--sang);
        }

        .hero__nav-links {
          display: flex;
          gap: 1.75rem;
          list-style: none;
        }
        .hero__nav-links a {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(212,201,176,0.5);
          text-decoration: none;
          transition: color 0.2s;
        }
        .hero__nav-links a:hover { color: var(--parchemin); }

        .hero__bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0; right: 0;
          z-index: 10;
          padding: 0.6rem clamp(1.5rem, 8vw, 8rem);
          border-top: 1px solid var(--gris-presse);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(to top, rgba(255,255,255,0.5), transparent);
          opacity: 0;
          transition: opacity 0.8s ease 1.8s;
        }
        .hero__bottom-bar.visible { opacity: 1; }
        .hero__bottom-bar span {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted-foreground);
        }
        .hero__bottom-bar strong {
          color: var(--sang);
          font-weight: normal;
        }

        @media (max-width: 640px) {
          .hero__nav-links { display: none; }
          .hero__issue { display: none; }
          .hero__scroll { display: none; }
        }
      `}</style>

      <section className="hero" ref={heroRef}>

        <div className="hero__issue" aria-hidden="true">I</div>

        <nav className={`hero__nav ${loaded ? 'visible' : ''}`}>
          <a href="/" className="hero__logo">
            La <span>Déraison</span>
          </a>
          <ul className="hero__nav-links">
            <li><a href="/lettres">Les Lettres</a></li>
            <li><a href="/pamphlets">Pamphlets</a></li>
            <li><a href="/apropos">La Fosse</a></li>
          </ul>
        </nav>

        <div className="hero__content">

          <div className={`hero__rule ${loaded ? 'visible' : ''}`} />

          <h1 className="hero__title">
            <span className="hero__title-line">
              <span className={`hero__title-inner hero__title-inner--delay1 ${loaded ? 'visible' : ''}`}>
                La Lettre
              </span>
            </span>
            <span className="hero__title-line">
              <span className={`hero__title-inner hero__title-inner--delay2 hero__title-inner--italic ${loaded ? 'visible' : ''}`}>
                de la déraison.
              </span>
            </span>
          </h1>

          <p className={`hero__tagline ${loaded ? 'visible' : ''}`}>
            Des textes violents. Stylisés. Parfois injustes.<br />
            Toujours écrits. Un pamphlet par jour.<br />
            Ici, pas de storytelling — de la langue.
          </p>

          <div className={`hero__cta-group ${loaded ? 'visible' : ''}`}>
            <a href="/lire" className="btn-primary">Entrer dans la fosse</a>
            <a href="/soutenir" className="btn-ghost">Devenir complice →</a>
          </div>
        </div>

        <div className={`hero__scroll ${loaded ? 'visible' : ''}`} aria-hidden="true">
          <span className="hero__scroll-text">Descendre</span>
          <div className="hero__scroll-line" />
        </div>

        <div className={`hero__bottom-bar ${loaded ? 'visible' : ''}`}>
          <span>Paraît <strong>sans autorisation</strong></span>
          <span>Une <strong>rage grammaticale</strong></span>
          <span>Service militaire <strong>de la langue française</strong></span>
        </div>
      </section>
    </>
  );
}
