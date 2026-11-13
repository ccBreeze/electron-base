import { resolve } from 'path'
import { defineConfig, type UserConfig } from 'electron-vite'
import type { ConfigEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import compressRenderer from '../plugins/rollup-plugin-compress-renderer.ts'

const getResolvePath = (dir: string) => resolve(process.cwd(), dir)

const isCompressRenderer = process.argv.includes('--compress')

export const rendererConfig = (config: ConfigEnv) => {
  return {
    renderer: {
      resolve: {
        alias: {
          '@renderer': getResolvePath('src/renderer/src'),
        },
      },
      plugins: [vue(), isCompressRenderer && compressRenderer({ mode: config.mode })],
    },
  } as UserConfig
}

export default defineConfig(rendererConfig)
