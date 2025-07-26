/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], // adjust as needed
  theme: {
    extend: {
      fontFamily: {
        'dm-sans': ['DM Sans', 'sans-serif'],
      },
      colors: {
        primary: '#7612fa',
        secondary: '#9333EA',
        accent: '#F59E0B',
        gravel: '#6B7280',
        iridium: '#9CA3AF',
        orange: '#F97316',
        cn: '#8B5CF6', // violet color
        platinum: '#E5E7EB',
      },
    },
  },
  plugins: [],
}

export default config
