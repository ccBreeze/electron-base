import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export const mainConfig = {
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
}

export default defineConfig(mainConfig)
