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
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
    },
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
