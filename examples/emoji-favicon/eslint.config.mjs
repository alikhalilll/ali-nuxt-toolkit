import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default defineConfig([
  {
    ignores: ['dist', 'node_modules', 'playground/.nuxt', 'playground/.output'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Runtime files must never import Nuxt's build-time Kit. This is the
    // single most common module-authoring regression — keep it in CI.
    files: ['src/**/runtime/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nuxt/kit',
              message: 'Do not import @nuxt/kit from runtime/. Build-time only. See post 13.',
            },
          ],
        },
      ],
    },
  },
]);
