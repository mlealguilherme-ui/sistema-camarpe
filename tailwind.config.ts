import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        script: ['var(--font-script)', 'Georgia', 'serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#1e3a5f',
          50: '#e8ecf2',
          100: '#c5d0df',
          200: '#9fb3c9',
          300: '#7896b3',
          400: '#557a9d',
          500: '#3d6187',
          600: '#1e3a5f',
          700: '#1a334f',
          800: '#162d44',
          900: '#12263a',
        },
        camarpe: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#c9a227',
          600: '#b8860b',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
      },
    },
  },
  plugins: [],
};
export default config;
