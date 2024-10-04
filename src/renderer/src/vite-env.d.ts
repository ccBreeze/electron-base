/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OSS 远程存放更新包目录 */
  readonly RENDERER_VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
