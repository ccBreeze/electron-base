export default class AppHotUpdate {
  info = {
    name: 'hotUpdate',
    restartAppText: '刷新界面',
  }
  checkUpdate = window.appUpdate.checkHotUpdate
  downloadPackage = window.appUpdate.downloadHotUpdate
  installPackage = window.appUpdate.installHotUpdate
  cancelDownloadPackage = window.appUpdate.cancelDownloadHotUpdate

  restartApp() {
    return location.reload()
  }
}
