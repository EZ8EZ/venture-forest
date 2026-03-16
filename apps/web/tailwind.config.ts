import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        bark: {
          light: '#8B7355',
          DEFAULT: '#6B4E3D',
          dark: '#3E2723',
        },
        canopy: {
          ai: '#1B5E20',
          fintech: '#2E7D32',
          climate: '#33691E',
          biotech: '#4A148C',
          consumer: '#E65100',
          devtools: '#0D47A1',
        },
        overlay: {
          bg: 'rgba(10, 12, 16, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#E8E6E3',
          muted: '#9CA3AF',
          accent: '#6EE7B7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config;
