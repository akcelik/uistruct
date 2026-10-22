const angular = require('angular-eslint');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Project uses StrctXxx naming convention, not StrctXxxComponent.
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',
      // Allow both element and attribute selectors with strct/app prefix.
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: ['strct', 'app'], style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: ['strct', 'app'], style: 'kebab-case' },
      ],
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/use-component-selector': 'off',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/no-output-native': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      // CVA stubs are intentional.
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['arrowFunctions', 'private-constructors', 'protected-constructors'] },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Errors, not warnings: every pointer-only handler in the library carries
      // an eslint-disable comment that says where its keyboard path lives, so
      // a new one has to make the same argument to land.
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
    },
  },
  {
    // The datagrid's feature-object inputs (5.30.0, sole API since 6.0): each
    // object is declared as `xxxCfg` / `xxxInput` with `alias: 'xxx'`, so the
    // template-facing name is `[selection]`, `[paging]`, `[pane]`, `[virtual]`,
    // `[grouping]`, `[filtering]` and `[state]`, while the class keeps the
    // plain name free for the resolved signal it derives (`paging()`,
    // `virtual()`, …). The alias is how the public name and the derived
    // signal coexist — not a rename to guard against.
    files: ['projects/strct/src/lib/datagrid/datagrid.ts'],
    rules: { '@angular-eslint/no-input-rename': 'off' },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@angular-eslint/use-component-selector': 'off',
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/component-selector': 'off',
    },
  }
);
