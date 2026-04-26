module.exports = {
  env: {
    node: true,
    es2021: true,
    browser: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  ignorePatterns: ['docs/', 'investor/', 'public/', 'migrations/', 'seeders/', 'src/external/telegram/', 'src/intelligence/ai-for-managers/hr/', 'src/intelligence/automation/', 'src/security/defense/', 'src/middleware/auth.js'],
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-var': 'off',
    'prefer-const': 'off',
    'comma-dangle': ['off'],
    'object-curly-spacing': ['off'],
    'array-bracket-spacing': ['off'],
    'no-unreachable': 'off',
    'no-empty': 'off',
    'no-prototype-builtins': 'off',
    'no-case-declarations': 'off',
    'no-control-regex': 'off',
    'no-undef': 'off',
    'no-const-assign': 'off',
    'no-dupe-keys': 'off',
    'parser': 'off',
    'parserErrors': 'off'
  }
};
