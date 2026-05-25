import AppFullUpdate from './full.ts'
import AppHotUpdate from './hot.ts'

type AppInfo = {
  currentVersion: string
}

export type DownloadPackageParams = {
  channel: string
  serverVersion: string
}

const ON_PROGRESS_CHANNEL = 'appUpdateDonwload'

const getAppInfo = () =>
  fetch(`${import.meta.env.RENDERER_VITE_API_URL}/api/version`).then((res) => res.json())

class AppUpdate {
  /** request 返回参数 */
  appInfo: null | AppInfo = null
  static downloadTask: null | Promise<unknown> = null
  static appFullUpdate = new AppFullUpdate()
  static appHotUpdate = new AppHotUpdate()
  static updater: null | AppFullUpdate | AppHotUpdate = null

  static instance: AppUpdate
  static getInstance() {
    return (AppUpdate.instance ??= new AppUpdate())
  }

  get updaterInfo() {
    return AppUpdate.updater?.info
  }

  get isHotUpdate() {
    return this.updaterInfo?.name === 'hotUpdate'
  }

  getCurrentVersion() {
    return window.appUpdate.getRendererVersion()
  }

  checkDownloadLock(version: string) {
    if (AppUpdate.downloadTask && this.appInfo && this.appInfo.currentVersion !== version) {
      console.error('~ AppUpdate ~ checkDownloadLock ~ 正在下载热更新版本，版本信息不一致:')
      throw Error('正在下载热更新版本，版本信息不一致')
    }
  }

  static async checkAndTransitionUpdater(version) {
    if (this.downloadTask) {
      console.log('~ AppUpdate ~ checkAndTransitionUpdater ~ this.downloadTask:')
      return true
    }

    // 接口暂时不支持通过版本号区分全量/热更新

    // 1. 检查是否有全量更新
    const hasFullUpdate = await this.appFullUpdate.checkUpdate(version)
    console.log('~ AppUpdate ~ checkAndTransitionUpdater ~ hasFullUpdate:', hasFullUpdate)
    if (hasFullUpdate) {
      this.updater = this.appFullUpdate
      return true
    }
    // 2. 检查是否有热更新
    // 接口提供的 currentVersion 仅用于检查热更新
    const hasHotUpdate = await this.appHotUpdate.checkUpdate(version)
    console.log('~ AppUpdate ~ checkAndTransitionUpdater ~ hasHotUpdate:', hasHotUpdate)
    if (hasHotUpdate) {
      this.updater = this.appHotUpdate
      return true
    }
    return false
  }

  async checkUpdate(info?: AppInfo) {
    // 耦合接口 - 同时支持传入
    const appInfo = info || (await getAppInfo())
    // 版本号为空，不更新
    if (!appInfo.currentVersion) {
      return false
    }
    console.log('~ AppUpdate ~ checkUpdate ~ appInfo:', appInfo)
    appInfo.currentVersion = appInfo.currentVersion.replace(/[a-zA-z]+/g, '')
    this.checkDownloadLock(appInfo.currentVersion)

    this.appInfo = appInfo
    return AppUpdate.checkAndTransitionUpdater(appInfo.currentVersion)
  }

  async downloadPackage(onProgress?: (progress: number) => void) {
    console.log('~ AppUpdate ~ downloadPackage:')
    if (onProgress) {
      window.appUpdate.onDownloadPackageProgress(onProgress, ON_PROGRESS_CHANNEL)
    }

    // 兼容多次调用
    AppUpdate.downloadTask ??= AppUpdate.updater!.downloadPackage({
      serverVersion: this.appInfo!.currentVersion,
      channel: ON_PROGRESS_CHANNEL,
    }).finally(() => {
      AppUpdate.resetDownloadState()
    })

    await AppUpdate.downloadTask
  }

  cancelDownloadPackage() {
    console.log('~ AppUpdate ~ cancelDownloadPackage:')
    AppUpdate.updater?.cancelDownloadPackage()
    AppUpdate.resetDownloadState()
  }

  async installPackage() {
    console.log('~ AppUpdate ~ installPackage:')
    // 热更新需要提前安装，再刷新页面
    await (AppUpdate.updater as AppHotUpdate).installPackage?.(this.appInfo!.currentVersion)
  }

  restartApp() {
    console.log(' ~ AppUpdate ~ restartApp:')
    return AppUpdate.updater?.restartApp()
  }

  static resetDownloadState() {
    this.downloadTask = null
  }

  async launchPageUpdate() {
    // if (import.meta.env.DEV) return

    console.log('AppUpdate ~ exec launchPageUpdate')
    const hasUpdate = await this.checkUpdate()
    if (!hasUpdate) return

    const callHref = location.href
    await this.downloadPackage()

    console.log('AppUpdate ~ launchPageUpdate ~ callHref:', callHref)
    console.log('AppUpdate ~ launchPageUpdate ~ location.href:', location.href)
    // URL 发生改变
    if (location.href !== callHref) return
    await this.installPackage()

    this.restartApp()
  }
}

export default AppUpdate.getInstance()
