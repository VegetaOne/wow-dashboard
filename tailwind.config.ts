import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Archivo", "system-ui", "sans-serif"],
        heading: ["Archivo", "system-ui", "sans-serif"],
      },
      borderRadius: {
        none: "0", sm: "0", DEFAULT: "0", md: "0", lg: "0", xl: "0", "2xl": "0", "3xl": "0", full: "0",
      },
      colors: {
        // Modernist-Rollen — lesen die CSS-Variablen aus globals.css
        ground: "var(--color-bg)",
        surface: "var(--color-surface)",
        ink: "var(--color-text)",
        line: "var(--color-divider)",
        accent: {
          DEFAULT: "var(--color-accent)",
          100: "var(--color-accent-100)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
          800: "var(--color-accent-800)",
        },
        neutral: {
          100: "var(--color-neutral-100)",
          300: "var(--color-neutral-300)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
        },
        faction: {
          horde: "var(--faction-horde)",
          alliance: "var(--faction-alliance)",
        },

        // WoW Klassen-Farben — nur als Marker (Punkt/Quadrat), nicht als Textfarbe
        wow: {
          warrior: "#C79C6E", paladin: "#F58CBA", hunter: "#ABD473", rogue: "#FFF569",
          priest: "#FFFFFF", deathknight: "#C41F3B", shaman: "#0070DE", mage: "#69CCF0",
          warlock: "#9482C9", monk: "#00FF96", druid: "#FF7D0A", demonhunter: "#A330C9",
          evoker: "#33937F",
        },
        // Item-Qualität — als 2px-Kante am Slot
        quality: {
          poor: "#9D9D9D", common: "#FFFFFF", uncommon: "#1EFF00", rare: "#0070FF",
          epic: "#A335EE", legendary: "#FF8000", artifact: "#E6CC80", heirloom: "#00CCFF",
        },
      },
    },
  },
  plugins: [],
}

export default config
