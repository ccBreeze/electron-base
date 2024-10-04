import appUpdate from './modules/appUpdate.ts'

declare global {
  interface Window {
    appUpdate: typeof appUpdate
  }
}
