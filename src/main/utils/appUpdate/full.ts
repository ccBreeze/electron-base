import { ipcMain, app, type IpcMainInvokeEvent } from 'electron'
import pkg, { type ProgressInfo } from 'electron-updater'
import { logger } from '../log.ts'
import { APP_UPDATE_OSS_URL } from '../config/constant.ts'
import { compareVersion } from './version.ts'

const { autoUpdater, CancellationToken } = pkg

// 开发模式测试全量更新
if (import.meta.env.DEV) {
  Object.defineProperty(app, 'isPackaged', {
    get() {
      return true
    },
  })
}

const checkFullUpdate = async (event: IpcMainInvokeEvent, serverVersion: string) => {
  const appVersion = app.getVersion()
  logger.info('~ checkFullUpdate: %o', { serverVersion, appVersion, APP_UPDATE_OSS_URL })
  // 1. request 是否允许更新
  const semVer = serverVersion.split('.').slice(0, 3).join('.')
  const isAllowUpdate = compareVersion(semVer, appVersion)
  if (isAllowUpdate === 0) {
    logger.info(`~ checkFullUpdate ~ isAllowUpdate: ${isAllowUpdate}`)
    return false
  }

  // 2. 询问 OSS .yml 是否有更新
  autoUpdater.setFeedURL(`${APP_UPDATE_OSS_URL}/${serverVersion}`)
  const info = await autoUpdater.checkForUpdates()
  if (!info) {
    const errorMsg = '~ checkFullUpdate ~ OSS 不存在 latest.yml 文件'
    logger.error(errorMsg)
    throw errorMsg
  }
  const result = compareVersion(info.updateInfo.version, appVersion)

  logger.info(`~ checkFullUpdate ~ result: ${result}, info: %o`, info)
  return result !== 0
}

const downloadFullUpdate = async (event: IpcMainInvokeEvent, channel: string) => {
  logger.info('~ downloadFullUpdate ~ channel:', channel)
  const cancellationToken = new CancellationToken()

  // 监听进度条
  const ipcReplyProgress = (progressInfo: ProgressInfo) => {
    logger.info('~ ipcReplyProgress ~ progress: %o', progressInfo)
    event.sender.send(channel, progressInfo.percent)
  }
  channel && autoUpdater.on('download-progress', ipcReplyProgress)
  // 监听取消下载
  const cancel = () => cancellationToken.cancel()
  ipcMain.once('cancelDownloadFullUpdate', cancel)

  await autoUpdater
    .downloadUpdate(cancellationToken)
    .catch((err) => {
      logger.error('~ downloadFullUpdate ~ err: %o', err)
      throw err
    })
    .finally(() => {
      autoUpdater.removeListener('download-progress', ipcReplyProgress)
      ipcMain.off('cancelDownloadFullUpdate', cancel)
    })
}

const quitAndInstall = (event: IpcMainInvokeEvent, isSilent = true, isForceRunAfter = true) => {
  logger.info(`~ quitAndInstall ~ isForceRunAfter: ${isForceRunAfter}, isSilent: ${isSilent}`)
  autoUpdater.quitAndInstall(isSilent, isForceRunAfter)
}

export default () => {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = true

  ipcMain.handle('checkFullUpdate', checkFullUpdate)
  ipcMain.handle('downloadFullUpdate', downloadFullUpdate)
  ipcMain.handle('quitAndInstall', quitAndInstall)
}
