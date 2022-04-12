var tailwindcss = require("tailwindcss");
module.exports = {
  plugins: [
    require("postcss-import")(),
    tailwindcss("./tailwind.config.cjs"),
    require("autoprefixer"),
  ],
};