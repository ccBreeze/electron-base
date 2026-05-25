/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OSS 远程存放更新包目录 */
  readonly MAIN_VITE_APP_UPDATE_OSS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
