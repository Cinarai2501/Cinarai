import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F5F9FD',
          100: '#EAF4FF',
          200: '#CDE4F8',
          300: '#A8D0F0',
          400: '#70AFE0',
          500: '#2583D5',
          600: '#2583D5',
          700: '#1769B0',
          800: '#14558E',
          900: '#123F67',
          950: '#0D2C49',
        },
        canvas: '#F5F9FD',
        surface: '#FFFFFF',
        ink: '#172D49',
        'secondary-content': '#5F6F84',
        muted: '#94A3B8',
        'ui-border': '#E2E8F0',
        success: {
          50: '#EAF8F3',
          100: '#D5F1E7',
          200: '#ADE3D0',
          300: '#7DD2B6',
          400: '#45BD96',
          500: '#16A37A',
          600: '#128663',
          700: '#106C52',
          800: '#105744',
          900: '#104839',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DC5252',
          600: '#C83F3F',
          700: '#A83232',
          800: '#8B2D2D',
          900: '#742B2B',
        },
        // Primary Color - Warm Blue (Harmoni & Kepercayaan)
        primary: {
          50: '#f0f7ff',
          100: '#e0f0ff',
          200: '#c1e1ff',
          300: '#a1d2ff',
          400: '#5fb3ff',
          500: '#1e94ff', // Main Primary
          600: '#1875cc',
          700: '#135699',
          800: '#0d3766',
          900: '#061833',
          950: '#030b1a',
        },
        // Secondary Color - Warm Orange (Energi & Kreativitas)
        secondary: {
          50: '#fff7ed',
          100: '#ffecd5',
          200: '#ffd9ab',
          300: '#ffc680',
          400: '#ffb356',
          500: '#ff9f2d', // Main Secondary
          600: '#cc7d24',
          700: '#995c1b',
          800: '#663a12',
          900: '#331d09',
          950: '#1a0e04',
        },
        // Accent/Success - Green
        accent: {
          50: '#EAF8F3',
          100: '#D5F1E7',
          200: '#ADE3D0',
          300: '#7DD2B6',
          400: '#45BD96',
          500: '#16A37A',
          600: '#128663',
          700: '#106C52',
          800: '#105744',
          900: '#104839',
        },
        // Info
        info: {
          50: '#EAF4FF',
          100: '#D5EAFE',
          200: '#B1D7F6',
          300: '#82BDEB',
          400: '#4C9BDD',
          500: '#2583D5',
          600: '#1C70B9',
          700: '#1769B0',
          800: '#14558E',
          900: '#123F67',
        },
        // Warning - Amber
        warning: {
          50: '#FFF8EA',
          100: '#FDECC8',
          200: '#F9D990',
          300: '#F3C267',
          400: '#EEAF4F',
          500: '#E9A23B',
          600: '#D88D2D',
          700: '#A96320',
          800: '#85501F',
          900: '#6E431D',
        },
        // Error - Red
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#DC5252',
          600: '#C83F3F',
          700: '#A83232',
          800: '#8B2D2D',
          900: '#742B2B',
        },
        // Neutral/Gray
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontSize: {
        // Typography Scale
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em' }], // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }], // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }], // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
        '5xl': ['3rem', { lineHeight: '1.2' }], // 48px
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['Menlo', 'Monaco', '"Courier New"', 'monospace'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        // Radius Scale
        'none': '0',
        'xs': '0.25rem', // 4px
        'sm': '0.375rem', // 6px
        'base': '0.5rem', // 8px
        'md': '0.75rem', // 12px
        'lg': '1rem', // 16px
        'xl': '1.5rem', // 24px
        '2xl': '2rem', // 32px
        'full': '9999px',
      },
      boxShadow: {
        // Shadow System
        'none': 'none',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'base': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'md': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'focus': '0 0 0 3px rgba(30, 148, 255, 0.1), 0 0 0 2px rgba(30, 148, 255, 0.8)',
      },
      spacing: {
        // Spacing Scale (base 4px)
        '0': '0',
        '0.5': '0.125rem', // 2px
        '1': '0.25rem', // 4px
        '1.5': '0.375rem', // 6px
        '2': '0.5rem', // 8px
        '2.5': '0.625rem', // 10px
        '3': '0.75rem', // 12px
        '3.5': '0.875rem', // 14px
        '4': '1rem', // 16px
        '5': '1.25rem', // 20px
        '6': '1.5rem', // 24px
        '7': '1.75rem', // 28px
        '8': '2rem', // 32px
        '9': '2.25rem', // 36px
        '10': '2.5rem', // 40px
        '11': '2.75rem', // 44px
        '12': '3rem', // 48px
        '14': '3.5rem', // 56px
        '16': '4rem', // 64px
        '20': '5rem', // 80px
        '24': '6rem', // 96px
        '28': '7rem', // 112px
        '32': '8rem', // 128px
        safe: 'max(var(--tw-spacing-4), env(safe-area-inset-bottom))',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      transitionDuration: {
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      zIndex: {
        'tooltip': '40',
        'dropdown': '50',
        'sticky': '20',
        'fixed': '30',
        'modal-backdrop': '40',
        'modal': '50',
        'popover': '60',
        'notification': '70',
      },
    },
  },
  plugins: [],
};

export default config;
