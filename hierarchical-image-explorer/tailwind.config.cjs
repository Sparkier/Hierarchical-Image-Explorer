const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
    colors: {
      transparent: 'transparent',
      'hie-red': '#ff3e00',
      'hie-gray': '#dfdfdf',
      neutral: colors.neutral,
    },
  },
  plugins: []
};