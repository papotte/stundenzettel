import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '**/node_modules/',
    '**/.next/',
    '**/next-env.d.ts',
    '**/out/',
    '**/dist/',
    '**/coverage/',
    '**/public/',
    '**/build/',
    'functions/lib',
    '**/e2e/',
    '**/scripts/',
    '**/jest.setup.tsx',
    '**/tailwind.config.ts',
  ]),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {},
    },
    plugins: {},
    rules: {
      ...tseslint.configs.recommended.rules,
      'import/order': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // ... any rules you want
      'jsx-a11y/alt-text': 'error',
      '@next/next/no-page-custom-font': 'off',
    },
    // ... others are omitted for brevity
  },
  {
    files: ['functions/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['**/*.tsx'],

    rules: {
      'react/prop-types': 'off',
    },
  },
])
