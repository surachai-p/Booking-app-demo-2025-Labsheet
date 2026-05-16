/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eff6ff', 500: '#2980b9', 700: '#1a5276', 900: '#1a1a2e' },
      },
    },
  },
  plugins: [],
}
