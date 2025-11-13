// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import globals from 'globals';
// @ts-expect-error missing declarations
import pluginChaiFriendly from 'eslint-plugin-chai-friendly';
import pluginImport from 'eslint-plugin-import';
import pluginStylistic from '@stylistic/eslint-plugin';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.browser,
        ...globals.mocha
      }
    },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true }
      }
    },
    plugins: {
      'chai-friendly': pluginChaiFriendly,
      'import': pluginImport,
      '@stylistic': pluginStylistic
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      'prefer-spread': 'off',
      'no-restricted-syntax': 'off',
      'consistent-return': 'off',
      'object-curly-newline': 'off',
      'prefer-template': 'off',
      'no-plusplus': 'off',
      'no-continue': 'off',
      'no-bitwise': 'off',
      'no-await-in-loop': 'off',
      'no-sequences': 'warn',
      'no-param-reassign': 'warn',
      'no-return-assign': 'warn',
      'no-else-return': ['error', { 'allowElseIf': true }],
      'no-shadow': 'off',
      'no-undef': 'error',
      'no-constant-condition': ['error', { 'checkLoops': 'all' }],
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'chai-friendly/no-unused-expressions': [ 'error', { allowShortCircuit: true } ],
      'arrow-body-style': 'off',
      'space-before-function-paren': 'off',
      'operator-linebreak': 'off',
      'implicit-arrow-linebreak': 'off',
      'no-underscore-dangle': 'off',
      'import/prefer-default-export': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unassigned-import': 'error',
      'import/named': 'error',
      'max-len': ['error', {
        'ignoreComments': true,
        'code': 130,
        'ignoreStrings': true,
        'ignoreTemplateLiterals': true,
        'ignoreRegExpLiterals': true
      }],
      'no-multiple-empty-lines': ['error'],
      'no-trailing-spaces': ['error'],
      'eol-last': ['error'],
      'padded-blocks': 'off',
      'max-classes-per-file': 'off',
      'no-empty': 'off',
      '@stylistic/semi': 'error',
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single', { 'avoidEscape': true }],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
