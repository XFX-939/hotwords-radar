import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        panel: "var(--panel)",
        "panel-soft": "var(--panel-soft)",
        line: "var(--line)",
        accent: "var(--accent)",
        success: "var(--success)",
        hot: "var(--hot)",
        risk: "var(--risk)"
      },
      borderRadius: {
        DEFAULT: "0.5rem"
      },
      typography: {
        invert: {
          css: {
            "--tw-prose-body": "var(--muted)",
            "--tw-prose-headings": "var(--foreground)",
            "--tw-prose-links": "var(--accent)"
          }
        }
      }
    }
  },
  plugins: []
};

export default config;
