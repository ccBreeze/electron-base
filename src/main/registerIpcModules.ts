import { type BrowserWindow } from 'electron'

export const registerIpcModules = async (win: BrowserWindow) => {
  const modules = import.meta.glob('./**/*.ts', {
    import: 'default',
  })

  const list: Promise<unknown>[] = []
  for (const path in modules) {
    const p = modules[path]().then((mod) => {
      typeof mod === 'function' && mod(win)
    })
    list.push(p)
  }

  await Promise.all(list)
}
