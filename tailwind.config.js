/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aurum: {
          dark: '#070A10',
          navy: '#0B1120',
          charcoal: '#111827',
          card: '#161F36',
          border: '#233052',
          gold: '#D4AF37',
          goldLight: '#F5E6B3',
          goldMuted: '#9B812E',
          accent: '#E5B842'
        }
      }
    },
  },
  plugins: [],
}

