/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          foreground: '#ffffff',
          dark: '#4338CA',
        },
        secondary: {
          DEFAULT: '#111827',
          foreground: '#ffffff',
        },
        accent: '#06B6D4',
        muted: '#F9FAFB',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 15px 45px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};
