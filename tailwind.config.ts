import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        ink: "hsl(var(--foreground))",
        abyss: "hsl(var(--background))",
        haze: "hsl(var(--secondary))",
        card: "hsl(var(--card))",
        line: "hsl(var(--border))",
        danger: "hsl(var(--destructive))",
        amber: "hsl(var(--warning))",
        moss: "hsl(var(--success))",
        sky: "hsl(var(--muted-foreground))",
      },
      boxShadow: {
        panel: "0 30px 90px rgba(0, 0, 0, 0.48)",
      },
      fontFamily: {
        sans: ["Aptos", "IBM Plex Sans", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
