/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        neutral: {
          50: '#faf9f7',
          100: '#f5f4f2',
          200: '#e8e6e3',
          300: '#d6d4d1',
          400: '#a3a19e',
          500: '#73716e',
          600: '#52504d',
          700: '#403f3d',
          800: '#262523',
          900: '#171716',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
