import pluginJs from '@eslint/js';
import pluginPrettier from 'eslint-config-prettier/flat';
import pluginImport from 'eslint-plugin-import';
import pluginJest from 'eslint-plugin-jest';
import pluginPromise from 'eslint-plugin-promise';
import pluginSonarjs from 'eslint-plugin-sonarjs';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginTs from 'typescript-eslint';

export default [
  {
    ignores: ['update-version.js', 'dist', 'coverage', 'data']
  },
  {
    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',
      parserOptions: {
        project: 'tsconfig.json'
      }
    },
    settings: {
      'import/resolver': {
        typescript: {}
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
  pluginJest.configs['flat/recommended'],
  {
    rules: {
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'no-console': 'error',
      '@typescript-eslint/restrict-template-expressions': 'off',

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

      'import/newline-after-import': [
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

      'import/order': [
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
  {
    files: ['test/**/*.test.ts'],
    rules: {
      'sonarjs/no-hardcoded-passwords': 'off' // eslint-disable-line sonarjs/no-hardcoded-passwords
    }
  }
];
