import { defineConfig } from 'electron-vite'
import type { ConfigEnv } from 'vite'

import { rendererConfig } from './renderer.js'

export default defineConfig((config: ConfigEnv) => {
  return {
    main: {},
    preload: {},
    ...rendererConfig(config),
  }
})
