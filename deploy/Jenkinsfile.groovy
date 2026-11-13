// 在可执行 Docker 命令并能访问 Docker 服务的 Linux 节点上运行。
pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
  }

  environment {
    BUILDER_IMAGE = 'electronuserland/builder:22-wine'
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

    stage('准备构建镜像') {
      steps {
        sh '''
            set -eu
            docker version
            docker pull --platform=linux/amd64 "$BUILDER_IMAGE"
          '''
      }
    }

    stage('打包 Windows 安装包') {
      steps {
        sh '''
            set -eu
            docker run --rm --init \\
              --platform=linux/amd64 \\
              --user "$(id -u):$(id -g)" \\
              --volume "$WORKSPACE:/project" \\
              --workdir /project \\
              --env CI \\
              --env COREPACK_ENABLE_DOWNLOAD_PROMPT \\
              --env COREPACK_HOME \\
              --env XDG_CACHE_HOME \\
              --env XDG_DATA_HOME \\
              --env npm_config_cache \\
              --env ELECTRON_CACHE \\
              --env ELECTRON_BUILDER_CACHE \\
              --env WINEPREFIX \\
              "$BUILDER_IMAGE" \\
              bash -euc '
                export XDG_RUNTIME_DIR=/tmp/jenkins-runtime
                mkdir -p "$WINEPREFIX" "$XDG_RUNTIME_DIR"
                chmod 700 "$XDG_RUNTIME_DIR"
                node --version
                corepack pnpm --version
                wine --version
                corepack pnpm install
                rm -rf out dist
                corepack pnpm run build:win --publish never
              '
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
