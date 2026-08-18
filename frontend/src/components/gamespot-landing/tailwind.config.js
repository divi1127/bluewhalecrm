/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
        },
        accent: {
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
        },
        night: {
          800: 'rgb(var(--night-800) / <alpha-value>)',
          850: 'rgb(var(--night-850) / <alpha-value>)',
          900: 'rgb(var(--night-900) / <alpha-value>)',
          950: 'rgb(var(--night-950) / <alpha-value>)',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4)',
        glow: '0 0 0 3px rgba(99,102,241,0.25)',
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
