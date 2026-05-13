import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: "#FFF8EC", warm: "#FFECCF", fill: "#F4E6CF", cream: "#FFF0D6" },
        ink:   { DEFAULT: "#2A1810", soft: "#6B5442", mute: "#9A7F63" },
        accent:{ DEFAULT: "#D86F24", deep: "#9A4E16", tertiary: "#B85E20" },
        secondary: {
          DEFAULT: "#2F8F83",
          soft: "#68AFA6",
          fill: "#DFF2EF",
          deep: "#1F625C",
        },
        neutral: {
          line: "#E2D3BE",
          panel: "#FFF4E3",
        },
        ok:    "#5A8A3A",
        wrong: "#B84A2A",
        gold:  "#F7C37A",
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
        "brut-accent":     "5px 5px 0 #D86F24",
        "brut-accent-lg":  "6px 6px 0 #D86F24",
        "brut-deep":       "5px 5px 0 #9A4E16",
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
