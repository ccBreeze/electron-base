import { resolve } from 'path'
import { defineConfig, type UserConfig } from 'electron-vite'
import type { ConfigEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import compressRenderer from '../plugins/rollup-plugin-compress-renderer.ts'

const getResolvePath = (dir: string) => resolve(process.cwd(), dir)

type RendererConfigOptions = {
  isCompressRenderer?: boolean
}

export const rendererConfig = (config: ConfigEnv, options: RendererConfigOptions = {}) => {
  const { isCompressRenderer = true } = options
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

export default defineConfig((config) => rendererConfig(config))
