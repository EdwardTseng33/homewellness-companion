import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        cream: '#FAF6F0',
        paper: '#FFFBF5',
        soft: '#F5E6D3',
        amber: {
          DEFAULT: '#D4712A',
          deep: '#B85A1F',
          light: '#E89B5F',
        },
        cocoa: {
          DEFAULT: '#8B4513',
          deep: '#5A2D0A',
        },
        ink: {
          DEFAULT: '#2A1F18',
          soft: '#4A3A2E',
          mute: '#8A7560',
        },
        border: 'rgba(212,113,42,0.18)',
        ring: 'rgba(212,113,42,0.35)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        serif: ['"Source Serif Pro"', '"Noto Serif TC"', 'Georgia', 'serif'],
        zh: ['"Noto Serif TC"', '"PingFang TC"', 'serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      boxShadow: {
        warm: '0 8px 24px -10px rgba(139, 69, 19, 0.18)',
        soft: '0 2px 8px -2px rgba(139, 69, 19, 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
