/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter Variable', 'system-ui', 'sans-serif'] },
      colors: { brand: { 50: '#F8FAFC', 100: '#D1FAE5', 400: '#34D399', 450: '#059669', 500: '#047857', 600: '#065F46', 700: '#064E3B', 800: '#0F172A' } },
      gridTemplateColumns: {
        '70/30': '70% 28%',
      },
    },
  },
  plugins: [],
};
