import Store from 'electron-store'
import { logger } from './log.ts'
import { ELECTRON_STORE_CWD } from './config/constant.ts'

class ConfigStore {
  config = {}
  /** 内存中缓存一份 */
  electronStore: any = new Store({
    name: 'configStore',
    cwd: ELECTRON_STORE_CWD,
  })

  constructor() {
    this.config = this.electronStore.store
  }

  static instance: ConfigStore
  static getInstance() {
    return (ConfigStore.instance ??= new ConfigStore())
  }

  get(key: string) {
    try {
      const value = this.config[key]
      logger.info(`ConfigStore ~ get ~ key: ${key}, value: %o`, value)
      return value
    } catch (error) {
      logger.error(`ConfigStore ~ get ~ key: ${key} error: %o`, error)
    }
  }

  set(key: string, value: unknown) {
    logger.info(`ConfigStore ~ set ~ key: ${key}, value: %o`, value)
    try {
      // 底层传入 Object 也是通过 Object.entries 合并值
      this.config[key] = value
      this.electronStore.set(key, value)
    } catch (error) {
      logger.error(`ConfigStore ~ set ~ key: ${key}, value: ${value}, error: %o`, error)
    }
  }
}

export default ConfigStore.getInstance()
