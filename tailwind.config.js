/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './public/index.html',
    "./src/**/*.{svelte,js,ts}"
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['forest', 'light'],
  },
}


