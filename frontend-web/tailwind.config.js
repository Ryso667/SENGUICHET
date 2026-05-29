/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#6366F1",
          light: "#818CF8",
          dark: "#4F46E5",
        },
        accent: {
          DEFAULT: "#FB923C",
          light: "#FDBA74",
          dark: "#F97316",
        },
        "bg-app": "#0A0B1A",
        surface: "rgba(255, 255, 255, 0.05)",
        success: "#22C55E",
        error: "#EF4444",
        warning: "#F59E0B",
      },
    },
  },
  plugins: [],
};
