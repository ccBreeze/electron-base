import fs from 'fs'
import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import axios from 'axios'
import { logger } from './log.ts'

type Options = {
  url: string
  outputPath: string
  signal?: AbortSignal
  channel?: string
}

// refactor: 如果后续支持多文件并发下载，可以考虑重构为 class 单例
// refactor: 如果存在多个地方需要 “检查文件是否存在 & 创建目录”，可以考虑集成到 download 中

export const DOWNLOAD_STATE = {
  /** 发生了无法恢复的错误，导致下载无法继续 */
  ERROR: -1,
  /** 下载尝试失败，可能是由于网络中断、服务器错误或其他问题 */
  Failed: -2,
  /** 下载成功完成，文件已完全保存在本地 */
  COMPLETED: 100,
}

export const ipcReplyProgress = (
  event: IpcMainInvokeEvent,
  progress: number,
  channel = 'onDownloadProgress'
) => {
  event.sender.send(channel, progress)
}

// 下载文件夹到指定目录
export const downloadFileToFolder = async (event: IpcMainInvokeEvent, options: Options) => {
  logger.info('~ downloadFileToFolder ~ options: %o', options)
  const writeStream = fs.createWriteStream(options.outputPath)

  const response = await axios({
    url: options.url,
    signal: options.signal,
    method: 'get',
    responseType: 'stream',
  })

  return new Promise((resolve, reject) => {
    const totalBytes = response.headers['content-length']
    logger.info('~ downloadFileToFolder ~ totalBytes: %s', totalBytes)
    let receivedBytes = 0
    let progress = 0

    const onError = (err: Error) => {
      logger.error('~ onError ~ err: &o', err)
      ipcReplyProgress(event, DOWNLOAD_STATE.ERROR, options.channel)
      writeStream.close() // 关闭流
      // 下载失败自动删除文件
      fs.unlink(options.outputPath, (err) => {
        if (err) {
          logger.error('~ fs.unlink ~ err: %o', err)
          return
        }
        logger.info('~ fs.unlink ~ outputPath: %s', options.outputPath)
      })
      reject(err)
    }

    response.data.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length
      const total = Math.floor((receivedBytes / totalBytes) * 100)
      // 节流 - 发送进度给渲染进程
      if (total !== progress) {
        progress = total
        ipcReplyProgress(event, progress, options.channel)
        logger.info('~ response.data.on ~ progress: %s', progress)
      }
    })
    response.data.pipe(writeStream)
    response.data.on('error', onError)

    writeStream.on('finish', () => {
      resolve(options.outputPath)
    })
    writeStream.on('error', onError)
  })
}

export default () => {
  ipcMain.handle('downloadFileToFolder', downloadFileToFolder)
}
