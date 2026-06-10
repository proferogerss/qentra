/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mag: {
          50:  '#f0f4ff',
          100: '#e0e8ff',
          200: '#c2d1ff',
          300: '#93aeff',
          400: '#6080ff',
          500: '#3a55f5',
          600: '#2337e8',
          700: '#1a26d4',
          800: '#1c24aa',
          900: '#1c2586',
          950: '#141754',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
