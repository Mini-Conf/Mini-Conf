module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true,
  },
  plugins: ["eslint-plugin-html"],
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    // disable rules from base configurations
    "camelcase": "off",
    "no-unused-vars": "off",
    "no-undef": "off",
    "func-names": "off",
    "no-param-reassign": "off",
  },
};
