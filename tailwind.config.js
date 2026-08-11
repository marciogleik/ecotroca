/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        escola: {
          DEFAULT: '#0F6E56',
          dark: '#0a4d3c',
          light: '#e7f0ee',
        },
        sicredi: {
          DEFAULT: '#185FA5',
          dark: '#114476',
          light: '#e8eff6',
        },
        prefeitura: {
          DEFAULT: '#2c4a8f', // Azul Marinho Oficial
          dark: '#1e3366',
          light: '#e8edf7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
