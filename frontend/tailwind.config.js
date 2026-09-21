/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
        },
        border: {
          primary: 'var(--border-primary)',
          glow: 'var(--border-glow)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
          emerald: 'var(--text-emerald)',
          amber: 'var(--text-amber)',
          crimson: 'var(--text-crimson)',
          violet: 'var(--text-violet)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': 'var(--shadow-glow-cyan)',
        'glow-emerald': 'var(--shadow-glow-emerald)',
        'glow-amber': 'var(--shadow-glow-amber)',
        'glow-crimson': 'var(--shadow-glow-crimson)',
        'glow-violet': 'var(--shadow-glow-violet)',
      },
    },
  },
  plugins: [],
}
