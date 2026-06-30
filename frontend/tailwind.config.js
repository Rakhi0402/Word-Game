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
        jade: {
          light: '#1b4d3e',
          DEFAULT: '#0d3b2e',
          dark: '#052219',
          gold: '#315f52',
        },
        gold: {
          light: '#f3c63f',
          DEFAULT: '#d4af37',
          dark: '#b08d1a',
        },
        parchment: {
          DEFAULT: '#f9f6f0',
          dark: '#e8e2d5',
        },
        wood: {
          light: '#5c3a21',
          DEFAULT: '#4a2c11',
          dark: '#2d1808',
        },
        rarity: {
          common: '#9ca3af', // Gray
          rare: '#3b82f6', // Blue
          epic: '#a855f7', // Purple
          legendary: '#f59e0b', // Gold/Orange
        }
      },
      fontFamily: {
        martial: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
