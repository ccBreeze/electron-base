import type { DownloadPackageParams } from './index'

export default class AppFullUpdate {
  info = {
    name: 'fullUpdate',
    restartAppText: '重啟界面',
  }
  checkUpdate = window.appUpdate.checkFullUpdate
  cancelDownloadPackage = window.appUpdate.cancelDownloadFullUpdate
  restartApp = window.appUpdate.quitAndInstall

  downloadPackage(params: DownloadPackageParams) {
    return window.appUpdate.downloadFullUpdate(params.channel)
  }
}
