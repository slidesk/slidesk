module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: ["airbnb-base", "prettier"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error"
  }
};
