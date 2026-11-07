/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#FFFFFF',
          sidebar: '#000000',
          card: '#FFFFFF',
          border: '#E5E5E5',
          subtle: '#F7F7F7',
          input: '#FFFFFF',
          'input-border': '#D9D9D9',
          text: '#111111',
          muted: '#777777',
        },
        neutral: {
          50: '#F9F9F9',
          100: '#F7F7F7',
          200: '#E5E5E5',
          300: '#D9D9D9',
          400: '#999999',
          500: '#777777',
          600: '#555555',
          700: '#333333',
          800: '#222222',
          900: '#111111',
          950: '#000000'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
