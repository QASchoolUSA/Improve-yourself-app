import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        bg: {
          DEFAULT: "#09090B",
          surface: "#18181B",
          elevated: "#27272A",
        },
        border: {
          DEFAULT: "#27272A",
          strong: "#3F3F46",
        },
        fg: {
          DEFAULT: "#FAFAFA",
          muted: "#A1A1AA",
          dim: "#71717A",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          from: "#6366F1",
          to: "#A855F7",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
        "accent-soft": "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgba(139, 92, 246, 0.4)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
