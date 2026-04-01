/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f141c',
        panel: '#141b25',
        accent: '#22d3ee'
      },
      boxShadow: {
        panel: '0 8px 24px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
};
