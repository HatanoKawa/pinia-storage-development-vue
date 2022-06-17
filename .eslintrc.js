module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'plugin:vue/vue3-recommended',
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'parser': '@typescript-eslint/parser',
    'sourceType': 'module',
  },
  'plugins': [
    'vue',
    '@typescript-eslint',
  ],
  'rules': {
    'max-len': 'off',
    'no-unused-vars': 'warn',
    'require-jsdoc': 'warn',
    'linebreak-style': ['error', 'windows'],
    'indent': ['error', 2],
  },
};
