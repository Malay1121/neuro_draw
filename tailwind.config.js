/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        neural: {
          cyan: '#00E0FF',
          magenta: '#FF2CFB',
          purple: '#A020F0',
          dark: '#0D0D0D',
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'neural-pulse': 'neural-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%': { 
            boxShadow: '0 0 5px rgba(0, 224, 255, 0.5)',
            transform: 'scale(1)',
          },
          '100%': { 
            boxShadow: '0 0 20px rgba(0, 224, 255, 0.8)',
            transform: 'scale(1.02)',
          },
        },
        'neural-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};