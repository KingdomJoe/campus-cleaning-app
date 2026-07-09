import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00ed64',
          dark: '#00684a',
          pressed: '#008c34',
          'on-green': '#001e2b',
          teal: '#001e2b',
          'teal-mid': '#003d4f',
          'teal-light': '#00684a',
        },
        canvas: '#ffffff',
        surface: {
          DEFAULT: '#f9fbfa',
          soft: '#f4f7f6',
        },
        hairline: {
          DEFAULT: '#e1e5e8',
          strong: '#c1ccd6',
        },
        ink: '#001e2b',
        slate: '#3d4f5b',
        steel: '#5c6c7a',
        stone: '#7c8c9a',
        muted: '#a8b3bc',
        accent: {
          purple: '#7b3ff2',
          orange: '#fa6e39',
          blue: '#3d4f9f',
          green: '#00ed64',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
        card: '12px',
        input: '8px',
      },
      fontSize: {
        micro: ['11px', { lineHeight: '1.4', fontWeight: '600' }],
        caption: ['13px', { lineHeight: '1.4' }],
        'body-sm': ['14px', { lineHeight: '1.55' }],
        'body-md': ['16px', { lineHeight: '1.55' }],
        subtitle: ['18px', { lineHeight: '1.4' }],
        h4: ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['28px', { lineHeight: '1.25', fontWeight: '700' }],
        h2: ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        h1: ['48px', { lineHeight: '1.1', fontWeight: '700' }],
      },
      boxShadow: {
        card: '0px 4px 12px rgba(0,30,43,0.08)',
        'card-hover': '0px 8px 24px rgba(0,30,43,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
