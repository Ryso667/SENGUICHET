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
          DEFAULT: "#00C8FF",
          light: "#33D4FF",
          dark: "#0077FF",
        },
        accent: {
          DEFAULT: "#0077FF",
          light: "#0099FF",
          dark: "#0055CC",
        },
        "bg-app": "#0D1B2A",
        "surface-card": "#152232",
        success: "#00E5A0",
        error: "#FF4D6D",
        warning: "#FFB347",
      },
    },
  },
  plugins: [],
};
