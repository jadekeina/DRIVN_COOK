/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette personnalisée Driv'n Cook
        primary: {
          50: '#EDF4FF',
          100: '#B9E6FF',
          500: '#5C95FF',
          600: '#4A7CDB',
          700: '#3865B7',
          900: '#2A4D94'
        },
        secondary: {
          100: '#FFA9A3',
          500: '#F87575',
          600: '#E55555',
          700: '#D13535'
        },
        accent: {
          500: '#7E6C6C',
          600: '#6B5555',
          700: '#583E3E'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(92, 149, 255, 0.1), 0 2px 4px -1px rgba(92, 149, 255, 0.06)',
        'custom-lg': '0 10px 15px -3px rgba(92, 149, 255, 0.1), 0 4px 6px -2px rgba(92, 149, 255, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-custom': 'pulseCustom 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseCustom: {
          '0%, 100%': {
            transform: 'scale(1)',
            backgroundColor: 'rgba(92, 149, 255, 0.1)'
          },
          '50%': {
            transform: 'scale(1.05)',
            backgroundColor: 'rgba(92, 149, 255, 0.2)'
          },
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #FFA9A3 0%, #F87575 100%)',
        'gradient-accent': 'linear-gradient(135deg, #7E6C6C 0%, #5C95FF 100%)',
      }
    },
  },
  plugins: [],
}