/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  env: {
    browser: true
  },
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    "plugin:vue/vue3-strongly-recommended",
    "plugin:vue/vue3-recommended",
    '@vue/eslint-config-prettier/skip-formatting',
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    "vue/no-undef-components": ["error", {
      "ignorePatterns": []
    }],
    "vue/no-useless-mustaches": ["error", {
      "ignoreIncludesComment": false,
      "ignoreStringEscape": false
    }],
    "@typescript-eslint/consistent-type-imports": "error"
  },
  overrides: [
    {
      "files": ["./**/*.ts", "./**/*.vue"],
      "rules": {
        "vue/multi-word-component-names": ["off"],
        "vue/no-reserved-component-names": ["off"],
        "vue/no-undef-components": ["off"]
      }
    }
  ]
}