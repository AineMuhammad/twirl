const config = {
  '*.{js,mjs,cjs,ts,tsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '!(*.{js,mjs,cjs,ts,tsx})': 'prettier --write --ignore-unknown',
};

export default config;
