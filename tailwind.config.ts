import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#065F46",
          light: "#047857",
          dark: "#022C22"
        },
        gold: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669"
        },
        parchment: {
          DEFAULT: "#F0FDF4",
          dark: "#04120D"
        },
        charcoal: "#1C2B24"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        bengali: ["var(--font-bengali)", "SolaimanLipi", "Noto Sans Bengali", "sans-serif"]
      },
      backgroundImage: {
        "paper-grain":
          "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.08), transparent 40%), radial-gradient(circle at 80% 60%, rgba(6,95,70,0.07), transparent 45%)",
        "glossy-sheen": "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.07) 100%)",
        "glossy-sheen-dark": "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.28) 100%)"
      },
      boxShadow: {
        card: "0 1px 2px rgba(6,95,70,0.08), 0 8px 24px -8px rgba(6,95,70,0.28)",
        glossy: "0 1px 0 rgba(255,255,255,0.45) inset, 0 10px 26px -8px rgba(4,60,46,0.5)",
        "glossy-dark": "0 1px 0 rgba(255,255,255,0.08) inset, 0 10px 26px -8px rgba(0,0,0,0.6)"
      }
    }
  },
  plugins: []
};

export default config;
