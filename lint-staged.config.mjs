/**
 * Root config: formats files outside the workspace packages. Each package has
 * its own lint-staged config (the closest config wins), which also runs ESLint.
 */
const config = {
  '*': 'prettier --write --ignore-unknown',
};

export default config;
