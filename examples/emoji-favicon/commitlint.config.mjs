export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
    'scope-enum': [
      1,
      'always',
      ['core', 'vite', 'vue', 'nuxt', 'resolver', 'docs', 'ci', 'release', 'deps'],
    ],
  },
};
