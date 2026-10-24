/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "var(--color-navy-950)",
          900: "var(--color-navy-900)",
          800: "var(--color-navy-800)",
        },
        slate: {
          850: "var(--color-slate-850)",
          750: "var(--color-slate-750)",
        },
        teal: {
          500: "var(--color-teal-500)",
          600: "var(--color-teal-600)",
          700: "var(--color-teal-700)",
        },
        emerald: {
          500: "var(--color-emerald-500)",
        },
        amber: {
          500: "var(--color-amber-500)",
        },
        rose: {
          500: "var(--color-rose-500)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "'SF Mono'",
          "Menlo",
          "Monaco",
          "Consolas",
          "'Liberation Mono'",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
