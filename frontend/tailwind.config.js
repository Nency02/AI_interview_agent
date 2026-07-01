/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        // AI theme palette
        brand: {
          50: '#f0f3ff',
          100: '#e1e7ff',
          200: '#c8d3ff',
          300: '#a3b4ff',
          400: '#798dff',
          500: '#5465ff', // Primary
          600: '#3b43f4',
          700: '#2d30df',
          800: '#2628b4',
          900: '#23278f',
        },
        dark: {
          50: '#f6f6f9',
          100: '#eef0f5',
          200: '#d9deea',
          300: '#b8c3da',
          400: '#91a2c5',
          500: '#7285b0',
          600: '#596b99',
          700: '#48557e',
          800: '#2f3752',
          900: '#1b1f32', // Dark background
          950: '#0f111d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
