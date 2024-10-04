import path from 'path'
import AdmZip from 'adm-zip'
import packageJson from '../../package.json'

type Params = {
  mode: string
  outputPath?: string
}

type Options = {
  dir: string
}

const NAME = 'compress-renderer'

export default function compressRendererPlugin(params: Params) {
  return {
    name: NAME,

    writeBundle(options: Options) {
      const packageMode = params.mode === 'production' ? 'PRO' : params.mode.toUpperCase()
      // 默认值
      Object.assign(params, {
        // 如果输出在 out 目录
        // 在下一次 electron-builder 时没有删除，会被 electron-builder 打包到 app.asar 中
        outputPath: path.join(
          process.cwd(),
          'dist',
          `renderer-${packageMode}-${packageJson.rendererVersion}.zip`
        ),
      })

      const zip = new AdmZip()
      zip.addLocalFolder(options.dir)
      zip.writeZip(params.outputPath)

      // 最底部输出打印
      setTimeout(() => {
        console.log(`${NAME} path: \x1B[32m${params.outputPath}`)
      })
    },
  }
}
