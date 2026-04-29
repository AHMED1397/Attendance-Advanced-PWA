/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary, #0EA5E9)", // Sky 500
          dark: "var(--color-primary-dark, #0284C7)",    // Sky 600
          light: "var(--color-primary-light, #E0F2FE)",   // Sky 100
        },
        background: "var(--theme-bg, #F8FAFC)", // Slate 50
        surface: "var(--theme-surface, #FFFFFF)",
        text: {
          main: "var(--theme-text-main, #0F172A)",     // Slate 900
          sub: "var(--theme-text-sub, #64748B)",      // Slate 500
        }
      }
    },
  },
  plugins: [],
}