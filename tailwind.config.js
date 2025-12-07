/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apple-gray': '#f5f5f8',
        'apple-dark': '#1d1d1f',
        'apple-blue': '#0071e3',
        'apple-light': '#f5f5f7',
      },
      fontFamily: {
        'sans': ['OpenAISans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}