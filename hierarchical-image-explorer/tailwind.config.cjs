const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
    colors: {
      transparent: 'transparent',
      'hie-red': '#d87472',
      'hie-gray': '#dfdfdf',
      'white': colors.white,
      neutral: colors.neutral,
      'hie-orange': '#f7bca6',
    },
  },
  plugins: []
};