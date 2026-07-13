/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E7EFEF",
          100: "#CFE0DF",
          400: "#3C7D77",
          500: "#2C655F",
          600: "#1B4B54",
          700: "#123840",
          900: "#0B2226",
        },
        gold: {
          50: "#FBF3DE",
          100: "#F5E4B8",
          400: "#D8B84A",
          500: "#C9A227",
          600: "#A6841E",
        },
        mist: "#F5F8F7",
      },
      fontFamily: {
        serif: ['"Fraunces"', "serif"],
        plex: ['"IBM Plex Sans"', "sans-serif"],
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        ticker: "ticker 28s linear infinite",
      },
    },
  },
  plugins: [],
};