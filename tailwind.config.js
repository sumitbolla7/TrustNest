/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: { brand: { 50: '#F8FAFC', 100: '#D1FAE5', 400: '#34D399', 450: '#10B981', 500: '#047857', 600: '#065F46', 700: '#064E3B', 800: '#022C22' } },
      gridTemplateColumns: {
        '70/30': '70% 28%',
      },
    },
  },
  plugins: [],
};
