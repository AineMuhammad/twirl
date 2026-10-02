/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Scopes are optional; when present they must be one of these.
    'scope-enum': [
      2,
      'always',
      [
        'web',
        'viewer',
        'config-schema',
        'eslint-config',
        'tsconfig',
        'embed',
        'api',
        'db',
        'auth',
        'editor',
        'admin',
        'ci',
        'deps',
        'docs',
        'adr',
        'release',
      ],
    ],
    'body-max-line-length': [2, 'always', 100],
  },
};
