import { is } from '@electron-toolkit/utils'
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer'

export async function loadVueDevtools(): Promise<void> {
  if (!is.dev) return

  try {
    const extension = await installExtension(VUEJS_DEVTOOLS, {
      loadExtensionOptions: { allowFileAccess: true },
    })

    console.log(`Vue Devtools 已加载：${extension.name}`)
  } catch (error) {
    console.error('Vue Devtools 加载失败', error)
  }
}
