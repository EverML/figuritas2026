/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)",
        float: "0 18px 48px rgba(15, 23, 42, 0.12)",
      },
      colors: {
        canvas: "#f4f7fb",
        ink: "#0f172a",
        muted: "#64748b",
        panel: "#ffffff",
        line: "#dbe4f0",
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
        },
        success: {
          50: "#ecfdf5",
          600: "#16a34a",
        },
        warning: {
          50: "#fff7ed",
          600: "#ea580c",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
