const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        'hie-red': '#d87472',
        'hie-gray': '#dfdfdf',
        'hie-orange': '#f7bca6',
      },
      backgroundImage: {
        'hie-background': "url('/img/HIE_HERO_2.svg')"
      },
    },
    fontFamily: {
      body: ['Quicksand']
    },

  },
  plugins: []
};