import next from '@twirl/eslint-config/next';

const config = [
  ...next,
  {
    // Runtime imports of the viewer entry would pull three.js (~850 KB) into every page's
    // initial JavaScript. Use types from '@twirl/viewer', values from '@twirl/viewer/settings',
    // and load the component itself lazily (LazyViewer).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/demo/LazyViewer.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@twirl/viewer',
              allowTypeImports: true,
              message:
                "Import types only. Use '@twirl/viewer/settings' for values and LazyViewer for the component.",
            },
          ],
        },
      ],
    },
  },
];

export default config;
