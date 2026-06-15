/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zenius: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          900: '#2E1065',
        }
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl':  '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'card':        '0 2px 8px rgba(109,40,217,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover':  '0 8px 30px rgba(109,40,217,0.14), 0 2px 8px rgba(0,0,0,0.06)',
        'glass':       '0 4px 24px rgba(109,40,217,0.08)',
        'purple-glow': '0 0 0 3px rgba(124,58,237,0.2)',
      }
    }
  },
  plugins: [],
}

