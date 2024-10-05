/**
 * Tips:
 *  - 仅仅只能修改「安装包名」和「快捷键名称」。
 *  - 如果想修改产品名称（包括注册表、electron-store等），需要修改 package.json 中的 name 字段。
 */

import dayjs from 'dayjs'

/** 打包环境 - [PRO | UAT] */
const env = (function () {
  const mode = /--mode\s+(\w+)|$/.exec(process.env.npm_lifecycle_script)[1]
  return mode ? mode.toUpperCase() : 'PRO'
})()

/** 安装包名 - KFCSOK_PRO_1.0.0_20240819 */
const artifactName = `\${productName}_${env}_\${version}_${dayjs().format('YYYYMMDD')}`

const config = {
  appId: 'com.electron.app',
  // productName: 'electron-base', // 使用 package.json name
  directories: {
    buildResources: 'build',
  },
  // 打包后会放入到 app.asar 目录中
  files: [
    '!**/.vscode/*',
    '!src/*',
    '!electron.vite.config.{js,ts,mjs,cjs}',
    '!{.eslintignore,.eslintrc.cjs,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md}',
    '!{.env,.env.*,.npmrc,pnpm-lock.yaml}',
    '!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}',
    '!out/renderer/**', // app.asar 目录中将不存在 out/renderer 文件夹
  ],
  // 将文件或目录直接复制到应用程序的资源目录
  extraResources: [
    // 将文件夹复制到 app.asar.unpacked 目录下
    {
      from: 'out/renderer',
      to: 'app.asar.unpacked/renderer',
    },
  ],
  // asar: false, // 不会产生 app.asar 而是一个 app 文件夹

  // 指定创建 asar 存档时要解压的文件
  // app.asar & app.asar.unpacked 都会有一份
  asarUnpack: ['resources/**'],
  win: {
    executableName: 'electron-base',
  },
  nsis: {
    artifactName: `${artifactName}.\${ext}`,
    shortcutName: '${productName}',
    uninstallDisplayName: '${productName}',
    createDesktopShortcut: 'always',
  },
  mac: {
    entitlementsInherit: 'build/entitlements.mac.plist',
    extendInfo: [
      { NSCameraUsageDescription: "Application requests access to the device's camera." },
      { NSMicrophoneUsageDescription: "Application requests access to the device's microphone." },
      {
        NSDocumentsFolderUsageDescription:
          "Application requests access to the user's Documents folder.",
      },
      {
        NSDownloadsFolderUsageDescription:
          "Application requests access to the user's Downloads folder.",
      },
    ],
    notarize: false,
  },
  dmg: {
    artifactName: `${artifactName}.\${ext}`,
  },
  // linux: {
  //   target: ['AppImage', 'snap', 'deb'],
  //   maintainer: 'electronjs.org',
  //   category: 'Utility',
  // },
  // appImage: {
  //   artifactName: '${name}-${version}.${ext}',
  // },
  npmRebuild: false,
  publish: {
    provider: 'generic',
    url: 'https://example.com/auto-updates', // 仅自动更新时需要
  },
}

// 非正式环境
if (env !== 'PRO') {
  config.nsis.shortcutName = artifactName
}

export default config
