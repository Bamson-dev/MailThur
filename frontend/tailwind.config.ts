import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#0F1117",
          top: "#0D0F1A",
          bottom: "#111420",
        },
        content: "#1A1D27",
        card: "#252836",
        surface: "#131625",
        "surface-elevated": "#131625",
        accent: "#7C3AED",
        "accent-dark": "#5B21B6",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        muted: "#6B7280",
        "text-heading": "#A0A8C0",
        body: "#CBD5E1",
        "card-border": "#1E2235",
        "border-subtle": "#1E2235",
        "row-hover": "#1A1D2E",
        "danger-zone": "#1A0D0D",
        "danger-border": "#3D1515",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "page-title": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        "section-heading": ["16px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["14px", { lineHeight: "1.5" }],
        "stat-number": ["36px", { lineHeight: "1.1", fontWeight: "700" }],
        "stat-label": [
          "12px",
          { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.1em" },
        ],
        "table-header": [
          "11px",
          { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.08em" },
        ],
      },
      boxShadow: {
        "purple-glow": "0 0 40px rgba(124, 58, 237, 0.15)",
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
