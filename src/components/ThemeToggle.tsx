import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sync initial state from the already-applied class
    setIsDark(document.documentElement.classList.contains('dark'));

    // Keep state in sync if theme changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextIsDark = !isDark;

    // Persist choice
    localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');

    // View Transition API circular reveal
    if (!document.startViewTransition) {
      // Fallback for browsers without support
      applyTheme(nextIsDark);
      setIsDark(nextIsDark);
      return;
    }

    // Capture click origin for the circle center
    const x = e.clientX;
    const y = e.clientY;

    // Compute max radius to cover entire viewport
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const clipPathStart = `circle(0px at ${x}px ${y}px)`;
    const clipPathEnd = `circle(${radius}px at ${x}px ${y}px)`;

    const transition = document.startViewTransition(() => {
      applyTheme(nextIsDark);
      setIsDark(nextIsDark);
    });

    // After snapshot is captured, animate the reveal
    await transition.ready;

    document.documentElement.animate(
      { clipPath: [clipPathStart, clipPathEnd] },
      {
        duration: 500,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`theme-toggle ${className}`}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? (
        // Sun icon
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon icon
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
