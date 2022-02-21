module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  parserOptions: {
    project: "tsconfig.json",
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    'prettier/prettier': 'warn',
  },
};