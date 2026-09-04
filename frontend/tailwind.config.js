/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#ff385c',
          dark: '#d90b3e',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        search: '0 3px 12px rgba(0, 0, 0, 0.1)',
        card: '0 6px 16px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
