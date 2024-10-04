import { app, ipcMain, type IpcMainInvokeEvent } from 'electron'
import fsPromises from 'node:fs/promises'
import path from 'path'
import AdmZip from 'adm-zip'
import { logger } from '../log.ts'

import { downloadFileToFolder, DOWNLOAD_STATE, ipcReplyProgress } from '../download.ts'
import { APP_UPDATE_OSS_URL } from '../config/constant.ts'
import configStore from '../configStore.ts'
import { compareVersion } from './version.ts'

/** app.asar.unpacked 目录路径 */
const UNPACKED_DIR = import.meta.env.PROD
  ? path.join(app.getAppPath(), '../app.asar.unpacked')
  : path.join(process.cwd(), 'out') // 开发模式热更新无效

const packageMode = import.meta.env.PROD ? 'PRO' : import.meta.env.MODE.toUpperCase()
const RENDERER_VERSION_KEY = 'rendererVersion_' + packageMode
const PACKAGE_NAME = 'renderer-' + packageMode

/** 安装包下载的临时存放目录 - 用于清理未下载成功的 renderer.tmp 文件 */
const TMEP_DIR_PATH = path.join(UNPACKED_DIR, 'tempPackage')

/** 下载 renderer.zip 文件的指定路径 */
const getRendererZipPath = (version: string) =>
  path.join(TMEP_DIR_PATH, `${PACKAGE_NAME}-${version}.zip`)

/** 获取 renderer 版本号 */
const getRendererVersion = async () => {
  // 全量更新成功，不会更新 rendererVersion 版本
  // 如果 renderer 版本号小于 appVersion 则返回 appVersion
  const appVersion = app.getVersion()
  const rendererVersion = configStore.get(RENDERER_VERSION_KEY)
  const result = compareVersion(appVersion, rendererVersion || '0')

  const version = result === 1 ? appVersion : rendererVersion
  logger.info('~ checkHotUpdate ~ getRendererVersion ~ %o', {
    version,
    appVersion,
    rendererVersion,
  })
  return version
}

const checkHotUpdate = async (event: IpcMainInvokeEvent, serverVersion: string) => {
  logger.info('~ checkHotUpdate ~ serverVersion: %s', serverVersion)
  const rendererVersion = await getRendererVersion()
  const result = compareVersion(serverVersion, rendererVersion)
  logger.info('~ checkHotUpdate ~ result: %s', result)
  return result === 1
}

const checkInstallPackageExists = async (zipPath: string) => {
  try {
    await fsPromises.access(zipPath)
    return true
  } catch (err) {
    logger.error('~ checkInstallPackageExists ~ fsPromises.access ~ err: %o', err)
    await fsPromises.mkdir(TMEP_DIR_PATH, { recursive: true }).catch((err) => {
      logger.error('~ checkInstallPackageExists ~ fsPromises.mkdir ~ err: %o', err)
    })
    return false
  }
}

const downloadHotUpdate = async (event: IpcMainInvokeEvent, { serverVersion, channel }) => {
  const downloadUrl = `${APP_UPDATE_OSS_URL}/${PACKAGE_NAME}-${serverVersion}.zip?${+new Date()}`
  const TMEP_PATH = path.join(TMEP_DIR_PATH, `${PACKAGE_NAME}.tmp`)

  const zipPath = getRendererZipPath(serverVersion)
  logger.info('~ downloadHotUpdate ~ zipPath: %s', zipPath)

  const hasPackage = await checkInstallPackageExists(zipPath)
  logger.info('~ downloadHotUpdate ~ hasPackage: %s', hasPackage)

  if (hasPackage) {
    ipcReplyProgress(event, DOWNLOAD_STATE.COMPLETED, channel)
    return
  }

  // 支持取消下载
  //  - bugfix: 渲染进程参数与主进程返回值，都会序列化
  const controller = new AbortController()
  const cancel = () => controller.abort()
  ipcMain.once('cancelDownloadHotUpdate', cancel)
  await downloadFileToFolder(event, {
    url: downloadUrl,
    outputPath: TMEP_PATH,
    signal: controller.signal,
    channel,
  })
    .catch((err) => {
      logger.info('~ downloadHotUpdate ~ err: %o', err)
      throw err
    })
    .finally(() => {
      ipcMain.removeListener('cancelDownloadHotUpdate', cancel)
    })

  // 检查资源完整性 - 重命名文件
  await fsPromises.rename(TMEP_PATH, zipPath)
}

const installHotUpdate = async (event: IpcMainInvokeEvent, serverVersion: string) => {
  const PACKAGE_DIR = path.join(UNPACKED_DIR, 'renderer')
  const zipPath = getRendererZipPath(serverVersion)
  logger.info(`~ installHotUpdate ~ PACKAGE_DIR: ${PACKAGE_DIR}, zipPath: ${zipPath}`)
  try {
    // 1. 解压到指定目录
    const zip = new AdmZip(zipPath)
    zip.extractAllTo(PACKAGE_DIR, true)
    // 2. 删除临时目录
    fsPromises.rm(TMEP_DIR_PATH, { recursive: true })
    // 3. 更新 version.json
    configStore.set(RENDERER_VERSION_KEY, serverVersion)
    // 4. 返回 UI 提示刷新界面
    return true
  } catch (err) {
    // bugfix: 网络不稳定时，下载的zip文件可能出现丢包的情况，导致解压失败
    // ERROR: Invalid or unsupported zip format. No END header found
    fsPromises.rm(TMEP_DIR_PATH, { recursive: true })
    throw err
  }
}

export default () => {
  ipcMain.handle('getRendererVersion', getRendererVersion)
  ipcMain.handle('checkHotUpdate', checkHotUpdate)
  ipcMain.handle('downloadHotUpdate', downloadHotUpdate)
  ipcMain.handle('installHotUpdate', installHotUpdate)
}
