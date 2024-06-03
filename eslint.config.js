// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  // ...tseslint.configs.strictTypeChecked,
  // ...tseslint.configs.stylisticTypeChecked,
  eslintPluginPrettier,
  {
    name: 'global ignores',
    ignores: ['dist/', 'build/', 'node_modules/'],
  },
  {
    name: 'javascript',
    files: ['**/*.js'],
    // ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: false,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    rules: {
      'no-console': 'warn',
      'no-undef': 'off',
      'spaced-comment': ['error', 'always'],
    },
  },
  {
    name: 'typescript',
    files: ['**/*.ts'],
    ignores: ['**/__test__/*', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-console': 'warn',
      'no-undef': 'off',
      'spaced-comment': ['error', 'always'],
    },
  },
);
