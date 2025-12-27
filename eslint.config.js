import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettierPlugin from "eslint-plugin-prettier"
import prettierConfig from "eslint-config-prettier"


export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 0,
      'react-hooks/set-state-in-effect': 0,
      'react-hooks/immutability': 0,
      '@typescript-eslint/no-unsafe-function-type': 0,
      '@typescript-eslint/no-unused-vars': 0,
      'react-hooks/rules-of-hooks': 0,
      ...prettierConfig.rules,
      "prettier/prettier": "error",
    },
    plugins: {
      prettier: prettierPlugin,
    }
  },
])
