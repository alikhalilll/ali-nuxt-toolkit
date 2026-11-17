/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'release',
      ],
    ],
    // Dependabot grouped-bump titles like
    // "ci(deps): bump ossf/scorecard-action from 2.4.3 to 2.5.0 in the actions-minor-patch group across 1 directory"
    // routinely exceed the conventional default of 100. 150 leaves headroom
    // without turning subjects into run-on paragraphs for humans.
    'header-max-length': [2, 'always', 150],
    'subject-max-length': [2, 'always', 150],
    // Dependabot bodies include markdown-linked dep names (`[pkg](url)`) that regularly
    // break 100 chars on a single line. Line-wrap of auto-generated bodies/footers isn't
    // a signal worth gating merges on; the header/subject rules stay strict.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
    'scope-empty': [0],
    'subject-case': [0],
  },
};
