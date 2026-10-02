// @ts-check
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

import { baseRules, ignores } from './base.js';

/** The Next.js app (`apps/web`). */
export default defineConfig(
  ignores,
  nextVitals,
  nextTs,
  tseslint.configs.strict,
  { rules: baseRules },
  prettier,
);
