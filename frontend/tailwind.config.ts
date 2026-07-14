import type { Config } from "tailwindcss";

// EveShield design tokens — emergency operations center theme.
// Palette: void black / deep navy panels / crimson for critical alerts /
// amber for warnings / signal green for resolved / operational cyan for
// active/in-progress state (kept distinct from the three semantic colors
// above so status can be read at a glance).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#05070A",
          raised: "#0A0E14",
        },
        panel: {
          DEFAULT: "#0D1420",
          raised: "#131C2B",
          border: "#1E293B",
        },
        crimson: {
          DEFAULT: "#E11D3C",
          soft: "#3A1220",
          bright: "#FF3355",
        },
        amber: {
          DEFAULT: "#F5A524",
          soft: "#3A2A0D",
        },
        signal: {
          DEFAULT: "#22C55E",
          soft: "#0F2A1B",
        },
        operational: {
          DEFAULT: "#38BDF8",
          soft: "#0D2536",
        },
        ink: {
          primary: "#E7ECF3",
          muted: "#8592A6",
          faint: "#4B5768",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(30,41,59,0.6), 0 8px 24px -12px rgba(0,0,0,0.7)",
        glow: "0 0 24px -4px rgba(225,29,60,0.45)",
      },
      keyframes: {
        pulse_ring: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        blink: "blink 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
