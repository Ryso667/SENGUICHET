/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "#FAFAFA",
          soft: "#F0FDF4",
          muted: "#DCFCE7",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#F9FAFB",
        },
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          muted: "#9CA3AF",
          inverse: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#15803D",
          light: "#22C55E",
          hover: "#166534",
          subtle: "#BBF7D0",
        },
        gold: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        success: "#15803D",
        error: "#DC2626",
        warning: "#F59E0B",
      },
    },
  },
  plugins: [],
};
