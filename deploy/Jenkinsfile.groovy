// 构建节点需能够访问 Docker，Jenkins 需安装 Docker Pipeline 插件。
pipeline {
  agent {
    docker {
      image 'electronuserland/builder:22-wine'
      args '--platform=linux/amd64'
    }
  }

  options {
    skipDefaultCheckout(true)
  }

  environment {
    CI = 'true'
    COREPACK_ENABLE_DOWNLOAD_PROMPT = '0'
    COREPACK_HOME = '/tmp/corepack'
    XDG_CACHE_HOME = '/tmp/cache'
    XDG_DATA_HOME = '/tmp/share'
    npm_config_cache = '/tmp/npm'
    ELECTRON_CACHE = '/tmp/electron'
    ELECTRON_BUILDER_CACHE = '/tmp/electron-builder'
    WINEPREFIX = '/tmp/wine'
  }

  stages {
    stage('检出代码') {
      steps {
        git branch: 'ci/jenkins', credentialsId: 'da22f974-8593-4da2-900b-1a420cc3c365', url: 'https://github.com/ccBreeze/electron-base'
      }
    }

    stage('检查构建环境') {
      steps {
        sh '''
            set -eu
            node --version
            corepack pnpm --version
          '''
      }
    }

    stage('安装依赖') {
      steps {
        // 允许安装时同步锁文件，兼容现有 package.json 与锁文件的差异。
        sh 'corepack pnpm install'
      }
    }

    stage('打包 Windows 安装包') {
      steps {
        sh '''
            set -eu
            rm -rf out dist
            corepack pnpm run build:win
        '''
      }
    }

    stage('归档安装包') {
      steps {
        archiveArtifacts(artifacts: 'dist/*.exe,dist/*.blockmap,dist/latest*.yml', fingerprint: true)
      }
    }
  }
}
