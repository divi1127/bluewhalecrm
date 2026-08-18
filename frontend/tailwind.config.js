/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}", "!./src/components/gamespot-landing/node_modules/**"],
  theme: {
    extend: {
      colors: {
        // BlueWhale ocean-park palette: deep navy, teal accent, sandy neutral, coral for alerts
        ocean: {
          50: "#eef6f9",
          100: "#d3e9f0",
          200: "#a7d3e1",
          300: "#71b5cc",
          400: "#3f8fae",
          500: "#276e8c",
          600: "#1c5570",
          700: "#17435a",
          800: "#123549",
          900: "#0b2431",
          950: "#071823",
        },
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        sand: {
          50: "#fdfaf4",
          100: "#f8f0e0",
          200: "#efe1c4",
        },
        coral: {
          400: "#ff8a65",
          500: "#ff7043",
          600: "#f4511e",
        },
        // Gamespot landing palette (scoped to .landing-root via CSS variables)
        brand: {
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
        },
        accent: {
          400: "rgb(var(--accent-400) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
        },
        night: {
          800: "rgb(var(--night-800) / <alpha-value>)",
          850: "rgb(var(--night-850) / <alpha-value>)",
          900: "rgb(var(--night-900) / <alpha-value>)",
          950: "rgb(var(--night-950) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4)",
        glow: "0 0 0 3px rgba(99,102,241,0.25)",
      },
      fontFamily: {
        display: ["'Poppins'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
