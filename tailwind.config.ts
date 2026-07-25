import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1B2A4A",
          light: "#2A3F6B",
          dark: "#111C33"
        },
        gold: {
          DEFAULT: "#D9A441",
          light: "#E8C27A",
          dark: "#B7852B"
        },
        parchment: {
          DEFAULT: "#FAF7F2",
          dark: "#0F1626"
        },
        charcoal: "#2B2B2B"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        bengali: ["var(--font-bengali)", "SolaimanLipi", "Noto Sans Bengali", "sans-serif"]
      },
      backgroundImage: {
        "paper-grain":
          "radial-gradient(circle at 20% 20%, rgba(217,164,65,0.06), transparent 40%), radial-gradient(circle at 80% 60%, rgba(27,42,74,0.05), transparent 45%)"
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,42,74,0.06), 0 8px 24px -8px rgba(27,42,74,0.18)"
      }
    }
  },
  plugins: []
};

export default config;
