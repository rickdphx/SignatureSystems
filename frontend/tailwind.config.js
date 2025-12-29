/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep Burgundy - Primary luxury color
        burgundy: {
          50: '#fdf4f5',
          100: '#fbe8eb',
          200: '#f6d5d9',
          300: '#eeb3bb',
          400: '#e38596',
          500: '#d45d73',
          600: '#bd3f5a',
          700: '#9f2f4a',
          800: '#6B1C23', // Main burgundy
          900: '#5a1820',
          950: '#320c11',
        },
        // Deep Navy - Secondary luxury color
        navy: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0dae7',
          300: '#a8bcd2',
          400: '#7898b9',
          500: '#567aa2',
          600: '#426188',
          700: '#364f6f',
          800: '#2f445d',
          900: '#0A1929', // Main navy
          950: '#08121a',
        },
        // Gold accent for luxury touches
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#D4AF37', // Signature gold
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // Set primary to burgundy for consistency
        primary: {
          50: '#fdf4f5',
          100: '#fbe8eb',
          200: '#f6d5d9',
          300: '#eeb3bb',
          400: '#e38596',
          500: '#d45d73',
          600: '#6B1C23',
          700: '#5a1820',
          800: '#4a1419',
          900: '#320c11',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
