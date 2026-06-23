import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        monova: {
          black: "#03050a",
          panel: "#07111d",
          orange: "#ff790f",
          amber: "#ffb253",
          cyan: "#69c8ff",
          blue: "#1e7bff"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space)", "var(--font-inter)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        holo: "0 0 38px rgba(105, 200, 255, 0.24), 0 0 74px rgba(255, 121, 15, 0.13)",
        orange: "0 0 34px rgba(255, 121, 15, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
