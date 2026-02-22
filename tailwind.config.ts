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
      },
      colors: {
        camarpe: {
          50: '#f0f9f4',
          100: '#dcf3e4',
          200: '#bce6cc',
          300: '#8dd3ab',
          400: '#56b882',
          500: '#339d62',
          600: '#247e4d',
          700: '#1e6540',
          800: '#1a5135',
          900: '#16432c',
        },
      },
    },
  },
  plugins: [],
};
export default config;
