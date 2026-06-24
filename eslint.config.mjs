import pluginJs from '@eslint/js';
import pluginVitest from '@vitest/eslint-plugin';
import pluginPrettier from 'eslint-config-prettier/flat';
import pluginImport from 'eslint-plugin-import-x';
import pluginPromise from 'eslint-plugin-promise';
import pluginSonarjs from 'eslint-plugin-sonarjs';
import pluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import pluginTs from 'typescript-eslint';

export default [
  {
    ignores: ['update-version.ts', 'dist', 'coverage', 'data']
  },
  {
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs']
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
        node: true
      }
    }
  },
  pluginJs.configs.recommended,
  ...pluginTs.configs.strictTypeChecked,
  ...pluginTs.configs.stylisticTypeChecked,
  pluginPrettier,
  pluginImport.flatConfigs.recommended,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  pluginPromise.configs['flat/recommended'], // fix soon
  pluginSonarjs.configs.recommended,
  pluginUnicorn.configs.recommended,
  {
    rules: {
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'no-console': 'error',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'unicorn/no-top-level-assignment-in-function': 'off',
      'unicorn/name-replacements': 'off',

      'spaced-comment': [
        'error',
        'always',
        {
          exceptions: ['-'],
          markers: ['/']
        }
      ],

      'arrow-parens': ['error', 'as-needed'],
      'arrow-body-style': ['error', 'as-needed'],
      'no-restricted-syntax': ['error', 'FunctionDeclaration'],

      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxEOF: 0,
          maxBOF: 0
        }
      ],

      'linebreak-style': ['error', 'unix'],
      'eol-last': ['error', 'always'],
      'prefer-destructuring': ['error'],

      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: true
        }
      ],

      'comma-dangle': ['error', 'never'],

      'import-x/newline-after-import': [
        'error',
        {
          count: 1
        }
      ],

      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true
        }
      ],

      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
          'newlines-between': 'always',

          alphabetize: {
            order: 'asc',
            caseInsensitive: false
          }
        }
      ]
    }
  },

  // vitest test files
  {
    files: ['__tests__/**/*.{js,ts}', '**/*.test.{js,ts}'],
    ...pluginVitest.configs.recommended,
    languageOptions: {
      globals: { ...globals.node, ...pluginVitest.environments.env.globals }
    },
    rules: {
      ...pluginVitest.configs.recommended.rules,
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-hardcoded-passwords': 'off'
    }
  },

  // skip export default rules for config files
  {
    files: ['eslint.config.mjs', 'vitest.config.ts'],
    rules: {
      'no-restricted-syntax': ['error', 'FunctionExpression', 'FunctionDeclaration']
    }
  }
];
