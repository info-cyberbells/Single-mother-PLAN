/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4d41df',
          50: '#f0effe',
          100: '#e3dfff',
          200: '#c4c0ff',
          300: '#9f99ff',
          400: '#7a71ff',
          500: '#4d41df',
          600: '#3622ca',
          700: '#2d1ab5',
          800: '#1f1099',
          900: '#100069',
        },
        secondary: {
          DEFAULT: '#674bb5',
          50: '#f3f0ff',
          100: '#e8ddff',
          200: '#cebdff',
          300: '#ab8ffe',
          400: '#8b67e0',
          500: '#674bb5',
          600: '#4f319c',
          700: '#3f1e8c',
          800: '#2d1275',
          900: '#21005e',
        },
        surface: {
          DEFAULT: '#fbf8fc',
          dim: '#dcd9dd',
          bright: '#fbf8fc',
          container: {
            lowest: '#ffffff',
            low: '#f6f2f7',
            DEFAULT: '#f0edf1',
            high: '#eae7eb',
            highest: '#e4e1e6',
          },
        },
        'on-surface': '#1b1b1e',
        'on-surface-variant': '#464555',
        outline: '#777587',
        'outline-variant': '#c7c4d8',
        glass: 'rgba(255,255,255,0.7)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4d41df 0%, #674bb5 100%)',
        'gradient-hero': 'linear-gradient(135deg, #f0effe 0%, #e8ddff 50%, #fbf8fc 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,237,241,0.9) 100%)',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(108, 99, 255, 0.08)',
        'glass-lg': '0 8px 40px rgba(108, 99, 255, 0.12)',
        primary: '0 4px 16px rgba(77, 65, 223, 0.3)',
        'primary-lg': '0 8px 32px rgba(77, 65, 223, 0.4)',
        card: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        card: '0.75rem',
        hero: '1.25rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        shimmer: 'shimmer 2s infinite linear',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
