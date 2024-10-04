import { contextBridge } from 'electron'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
const mount = process.contextIsolated
  ? contextBridge.exposeInMainWorld // 上下文隔离 webview(local)
  : (apiKey: string, api: unknown) => (window[apiKey] = api) // 远程托管 webview(URL)

// 自动导入
const modules = import.meta.glob('./modules/**/*.ts', {
  eager: true, // 异步需要 Promise.all()
  import: 'default',
})

// 创建目录树
const dirTree = {}
for (const path in modules) {
  // path: ./modules/appUpdate.ts
  const dirs = path.split('/').slice(2) // 移除 . modules 目录
  const fileName = dirs.pop()!.split('.')[0]
  const parentDir = dirs.reduce((parent, name) => (parent[name] ??= {}), dirTree)

  parentDir[fileName] = modules[path]
}

// 挂载
Object.entries(dirTree).forEach(([apiKey, api]) => mount(apiKey, api))
