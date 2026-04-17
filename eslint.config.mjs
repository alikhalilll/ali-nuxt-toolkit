// eslint.config.mjs — workspace root
import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  // 1. Ignore build artefacts
  {
    ignores: [
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/dist/**',
      '**/coverage/**',
      '**/artifacts/**',
      'WALKTHROUGH.md',
    ],
  },

  // 2. Base presets
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],

  // 3. Vue parser + overrides
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/one-component-per-file': 'off',
      // Demo/docs pages use scoped `style` blocks with arbitrary Tailwind utilities
      'vue/html-self-closing': 'off',
    },
  },

  // 4. Project-wide rules
  {
    files: ['**/*.{js,ts,vue,mjs}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // TypeScript already catches undefined refs more accurately than ESLint's
      // no-undef; disabling prevents false positives from Nuxt auto-imports
      // (ref, computed, useRoute, etc.).
      'no-undef': 'off',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },

  // 5. Node.js ESM scripts — process/global are available, console is intentional
  {
    files: ['scripts/**/*.{js,mjs}', '**/scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // 6. CommonJS config files
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: { ...globals.node, ...globals.commonjs },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  // 7. Playground relaxations — demo code, not production
  {
    files: ['playgrounds/**/*.{js,ts,vue,mjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'vue/no-v-html': 'off',
    },
  },

  // 8. Docs app relaxations — same reasoning
  {
    files: ['apps/docs/**/*.{js,ts,vue,mjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 9. Generated template strings contain TypeScript the consumer's Nuxt build
  // compiles — they should not be linted as code in this repo.
  {
    files: ['packages/*/src/templates/**/*.ts', 'packages/auto-middleware/src/build/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 10. Prettier (must be last — turns off stylistic rules that would conflict)
  prettierRecommended,
];
