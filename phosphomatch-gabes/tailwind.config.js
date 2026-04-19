/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0d7377', dark: '#094a4d', light: '#14a085' },
        accent: '#ff9f43',
        danger: '#e74c3c',
        success: '#10b981',
        warning: '#f59e0b',
        surface: '#f4f7f6',
        card: '#ffffff',
        ink: '#1a1a2e',
        muted: '#6b7280',
        border: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(13,115,119,0.08)',
        'card-hover': '0 8px 30px rgba(13,115,119,0.15)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
