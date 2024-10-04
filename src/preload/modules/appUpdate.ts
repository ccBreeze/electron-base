import { ipcRenderer, type IpcRendererEvent } from 'electron'

const onDownloadPackageProgress = (
  cb: (progress: number) => void,
  channel = 'onDownloadPackageProgress'
) => {
  const listener = (e: IpcRendererEvent, progress: number) => {
    cb(progress)
    // progress < 0 表示下载报错
    if (progress < 0 || progress === 100) {
      ipcRenderer.off(channel, listener)
    }
  }
  ipcRenderer.on(channel, listener)
}

export default {
  onDownloadPackageProgress,

  /** 检查热更新 */
  getRendererVersion: () => ipcRenderer.invoke('getRendererVersion'),
  checkHotUpdate: (serverVersion: string) => ipcRenderer.invoke('checkHotUpdate', serverVersion),
  downloadHotUpdate: (params: unknown) => ipcRenderer.invoke('downloadHotUpdate', params),
  installHotUpdate: (serverVersion: string) =>
    ipcRenderer.invoke('installHotUpdate', serverVersion),
  cancelDownloadHotUpdate: () => ipcRenderer.send('cancelDownloadHotUpdate'),

  /** 检查全量更新 */
  checkFullUpdate: (serverVersion: string) => ipcRenderer.invoke('checkFullUpdate', serverVersion),
  downloadFullUpdate: (channel: string) => ipcRenderer.invoke('downloadFullUpdate', channel),
  quitAndInstall: () => ipcRenderer.invoke('quitAndInstall'),
  cancelDownloadFullUpdate: () => ipcRenderer.send('cancelDownloadFullUpdate'),
}
