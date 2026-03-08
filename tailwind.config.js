/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f6efe4',
        parchment: '#fff8ef',
        terracotta: '#b85c38',
        saffron: '#dd8f3e',
        olive: '#526543',
        espresso: '#453127',
      },
      boxShadow: {
        card: '0 20px 60px rgba(69, 49, 39, 0.18)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Manrope"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
