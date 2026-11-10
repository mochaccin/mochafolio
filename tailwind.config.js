/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        rp: {
          base: '#1e1c29',
          surface: '#252336',
          overlay: '#3d3958',
          'card-border': '#3d3958',
          muted: '#6e6a86',
          subtle: '#a09abf',
          text: '#e8e6f0',
          love: '#e8a8c0',
          gold: '#f0d8a0',
          rose: '#e8c0c0',
          pine: '#8fc8d8',
          foam: '#a8e0d0',
          iris: '#c8b8e8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        full: '9999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.35)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(200, 184, 232, 0.15)',
      },
      animation: {
        'cursor-fade': 'cursorFade 1s ease-in-out infinite',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        cursorFade: {
          '0%': { opacity: '1' },
          '50%': { opacity: '1' },
          '51%': { opacity: '0' },
          '100%': { opacity: '0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        ping: {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      transitionDuration: {
        'fast': '120ms',
        'base': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}