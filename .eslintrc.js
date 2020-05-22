module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true,
  },
  plugins: [
    "eslint-plugin-html",
  ],
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
  },
};