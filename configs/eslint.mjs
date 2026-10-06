import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

/**
 * @param {{ rootDirectory: string }} options
 * @returns {ReturnType<typeof defineConfig>}
 */
export function createActionConfig({ rootDirectory }) {
  return defineConfig([
    { ignores: ['dist/**', 'coverage/**', 'node_modules/**', '.idea/**'] },
    {
      files: ['**/*.{ts,mts,cts,js,mjs,cjs}'],
      extends: [
        js.configs.recommended,
        tseslint.configs.strictTypeChecked,
        tseslint.configs.stylisticTypeChecked,
      ],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: rootDirectory,
        },
      },
      linterOptions: { reportUnusedDisableDirectives: 'error' },
      rules: {
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: false,
            allowTypedFunctionExpressions: false,
            allowHigherOrderFunctions: false,
            allowDirectConstAssertionInArrowFunctions: false,
            allowConciseArrowFunctionExpressionsStartingWithVoid: false,
            allowIIFEs: false,
          },
        ],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'never' },
        ],
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/strict-boolean-expressions': [
          'error',
          {
            allowString: false,
            allowNumber: false,
            allowNullableObject: false,
            allowNullableBoolean: false,
            allowNullableString: false,
            allowNullableNumber: false,
            allowAny: false,
          },
        ],
        '@typescript-eslint/no-floating-promises': [
          'error',
          { ignoreVoid: false },
        ],
        '@typescript-eslint/require-await': 'error',
        '@typescript-eslint/switch-exhaustiveness-check': [
          'error',
          { considerDefaultExhaustiveForUnions: true },
        ],
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: ['variable', 'function', 'parameter'],
            format: ['camelCase'],
          },
          { selector: 'typeLike', format: ['PascalCase'] },
        ],
        // TypeScript also checks names in JavaScript through checkJs.
        'no-undef': 'off',
        'no-var': 'error',
        'prefer-const': 'error',
        curly: ['error', 'all'],
      },
    },
    {
      files: ['**/*.{js,mjs,cjs}'],
      // JavaScript expresses types through JSDoc rather than TypeScript syntax.
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/consistent-type-imports': 'off',
      },
    },
    prettier,
  ])
}
