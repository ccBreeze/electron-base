import electronConfig from '@electron-toolkit/eslint-config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import pluginVue from 'eslint-plugin-vue'
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import prettier from '@vue/eslint-config-prettier'

export default withVueTs(
  {
    ignores: ['**/node_modules/**', 'dist/**', 'out/**', '.pnpm-store/**', '.gitignore'],
  },
  electronConfig,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  prettier,
  {
    rules: {
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['index'], //需要忽略的组件名
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
        },
      ],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
)
