import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "tf-blue": "#1e40af",
        "tf-blue-light": "#3b82f6",
        "tf-blue-dark": "#1e3a8a",
        "tf-accent": "#f59e0b",
        "tf-accent-dark": "#d97706",
        "tf-gray": "#f8fafc",
        "tf-dark": "#0f172a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;