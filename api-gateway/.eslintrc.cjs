module.exports = {
  root: true,
  ignorePatterns: ['dist/**', 'node_modules/**', 'fixAdmin.js', 'vitest.config.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json' },
  env: { node: true, es2022: true },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-empty': 'off',
    'prefer-const': 'off'
  }
};
