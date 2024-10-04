import { defineConfig } from 'electron-vite'
import type { ConfigEnv } from 'vite'

import { mainConfig } from './main.js'
import { rendererConfig } from './renderer.js'

export default defineConfig((config: ConfigEnv) => {
  return {
    ...mainConfig,
    ...rendererConfig(config),
  }
})
