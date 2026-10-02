// @ts-check
import { defineConfig } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import base from './base.js';

/**
 * Framework-agnostic React packages (e.g. `@twirl/viewer`).
 * They must stay embeddable anywhere, so app/framework/server imports are banned.
 */
export default defineConfig(
  base,
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['next', 'next/*', '@next/*'],
              message: 'Library packages must not depend on Next.js.',
            },
            {
              group: ['@prisma/*', 'next-auth', 'next-auth/*', '@auth/*'],
              message: 'Library packages must not know about the database or auth.',
            },
            { group: ['@twirl/web', '@twirl/web/*'], message: 'Libraries must not import the app.' },
          ],
        },
      ],
    },
  },
);
