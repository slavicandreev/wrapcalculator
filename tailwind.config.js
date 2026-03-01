/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs:   ['0.75em',  { lineHeight: '1rem' }],
        sm:   ['0.875em', { lineHeight: '1.25rem' }],
        base: ['1em',     { lineHeight: '1.5rem' }],
        lg:   ['1.125em', { lineHeight: '1.75rem' }],
        xl:   ['1.25em',  { lineHeight: '1.75rem' }],
        '2xl':['1.5em',   { lineHeight: '2rem' }],
        '3xl':['1.875em', { lineHeight: '2.25rem' }],
        '4xl':['2.25em',  { lineHeight: '2.5rem' }],
        '5xl':['3em',     { lineHeight: '1' }],
      },
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'count-up': 'countUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
