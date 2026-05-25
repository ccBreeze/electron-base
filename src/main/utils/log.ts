import path from 'path'
import { app } from 'electron'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const dirPath = import.meta.env.DEV ? process.cwd() : app.getPath('userData')
const dirname = path.join(dirPath, 'logs', '%DATE%')

const createDailyRotateFile = (filename: string) =>
  new DailyRotateFile({
    filename,
    dirname,
    datePattern: 'YYYYMMDD',
    zippedArchive: true,
    options: {
      flags: 'a', // 追加模式
      encoding: 'utf8', // 设置编码为 UTF-8
    },
  })

export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.printf((info) => `[${info.timestamp}] [${info.level}] ${info.message}`)
  ),

  transports: [
    ...(import.meta.env.DEV ? [new winston.transports.Console()] : []),
    createDailyRotateFile('app-debug.%DATE%.log'),
  ],

  // 所有未捕获的异常都将被记录到 'error.log' 文件中
  exceptionHandlers: [createDailyRotateFile('error.%DATE%.log')],

  // 所有未处理的 Promise 拒绝都将被记录到 'rejections.log' 文件中
  rejectionHandlers: [createDailyRotateFile('rejections.%DATE%.log')],
})
