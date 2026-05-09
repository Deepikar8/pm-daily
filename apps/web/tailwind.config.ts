import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: "#FBF7F0", warm: "#FBF1DC", fill: "#F0E8D4", cream: "#FFE8C2" },
        ink:   { DEFAULT: "#2A1810", soft: "#5C4634", mute: "#8B7355" },
        accent:{ DEFAULT: "#D2691E", deep: "#8B4513", tertiary: "#A0522D" },
        secondary: {
          DEFAULT: "#2F6F73",
          soft: "#5E8F92",
          fill: "#DDEDEC",
          deep: "#17484B",
        },
        neutral: {
          line: "#D8CEC0",
          panel: "#F7F2EA",
        },
        ok:    "#5A8A3A",
        wrong: "#B84A2A",
        gold:  "#E8B04B",
      },
      fontFamily: {
        serif: ['"Fraunces"', "Georgia", "serif"],
        sans:  ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        "brut-sm": "3px 3px 0 #2A1810",
        "brut":    "4px 4px 0 #2A1810",
        "brut-lg": "5px 5px 0 #2A1810",
        "brut-xl": "6px 6px 0 #2A1810",
        "brut-accent":     "5px 5px 0 #D2691E",
        "brut-accent-lg":  "6px 6px 0 #D2691E",
        "brut-deep":       "5px 5px 0 #8B4513",
      },
      keyframes: {
        flame:        { "0%,100%": { transform: "rotate(-3deg) scale(1)" },     "50%": { transform: "rotate(3deg) scale(1.08)" } },
        slideUp:      { from: { transform: "translateY(16px)", opacity: "0" }, to:    { transform: "translateY(0)",  opacity: "1" } },
        shake:        { "0%,100%": { transform: "translateX(0)" }, "25%": { transform: "translateX(-6px)" }, "75%": { transform: "translateX(6px)" } },
        correctPulse: { "0%": { boxShadow: "4px 4px 0 #2A1810" }, "50%": { boxShadow: "4px 4px 0 #2A1810, 0 0 0 8px rgba(90,138,58,0.25)" }, "100%": { boxShadow: "4px 4px 0 #2A1810" } },
      },
      animation: {
        flame:        "flame 1.6s ease-in-out infinite",
        slideUp:      "slideUp 0.4s ease-out",
        shake:        "shake 0.4s ease",
        correctPulse: "correctPulse 0.6s ease",
      },
    },
  },
  plugins: [],
} satisfies Config;
