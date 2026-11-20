import java.util.regex.Pattern

def dingTalkNotifier

pipeline {
  agent any

  tools {
    nodejs 'nodejs-v24'
  }

  options {
    skipDefaultCheckout(true)
    buildDiscarder(logRotator(numToKeepStr: '5'))
    timestamps()
    timeout(time: 10, unit: 'MINUTES')
  }

  triggers {
    GenericTrigger(
      genericVariables: [
        [key: 'WEBHOOK_REF', value: '$.ref'],
        [key: 'BRANCH', value: '$.ref', regexpFilter: '^refs/heads/'],
        [key: 'WEBHOOK_COMMIT', value: '$.after'],
        [key: 'WEBHOOK_DELETED', value: '$.deleted']
      ],
      tokenCredentialId: 'electron-base-webhook-token',
      causeString: 'GitHub push $WEBHOOK_REF',
      regexpFilterText: '$WEBHOOK_DELETED $WEBHOOK_REF $WEBHOOK_COMMIT',
      regexpFilterExpression: '^false refs/heads/(?:main|ci/jenkins) [0-9a-f]{40}$'
    )
  }

  parameters {
    choice(name: 'BRANCH', choices: ['ci/jenkins', 'main'], description: '选择要构建的代码分支')
    choice(name: 'PLATFORM', choices: ['windows', 'web'], description: '选择构建平台')
    choice(name: 'ENVIRONMENT', choices: ['uat', 'production'], description: '选择构建环境')
  }

  environment {
    /* 钉钉机器人 ID */
    DINGTALK_ROBOT_ID = 'd1585a55-ad97-4295-84f9-0afef92633fa'
  }

  stages {
    stage('检出代码') {
      steps {
        script {
          def buildBranch = params.BRANCH
          // Webhook 构建锁定推送的提交，避免排队期间分支更新改变打包内容。
          def revision = env.WEBHOOK_COMMIT ?: "*/${buildBranch}"
          echo "构建分支: ${buildBranch}"
          echo "Commit: ${revision}"
          checkout poll: false, scm: scmGit(
            branches: [[name: revision]],
            extensions: [localBranch(localBranch: buildBranch)],
            userRemoteConfigs: [[
              credentialsId: 'da22f974-8593-4da2-900b-1a420cc3c365',
              url: 'https://github.com/ccBreeze/electron-base'
            ]]
          )

          // 加载钉钉通知脚本
          catchError(buildResult: 'SUCCESS', catchInterruptions: false, message: '钉钉通知脚本加载失败') {
            dingTalkNotifier = load 'deploy/notifyDingTalk.groovy'
          }
          dingTalkNotifier?.send('STARTED')
        }
      }
    }

    stage('准备构建环境') {
      steps {
        sh '''
            node --version
            pnpm --version
          '''
      }
    }

    stage('安装依赖并清理产物') {
      steps {
        sh '''
            pnpm install --frozen-lockfile
            rm -rf out dist
          '''
      }
    }

    stage('打包 Windows 安装包') {
      when {
        expression { params.PLATFORM == 'windows' }
      }
      environment {
        WINEPREFIX = "${WORKSPACE}/tmp/wine"
        XDG_RUNTIME_DIR = "${WORKSPACE}/tmp/runtime"
      }
      stages {
        stage('准备 Wine 环境') {
          steps {
            sh '''
                mkdir -p "$WINEPREFIX" "$XDG_RUNTIME_DIR"
                chmod 700 "$XDG_RUNTIME_DIR"
                wine --version
              '''
          }
        }

        stage('执行 Windows 构建') {
          steps {
            sh '''
                pnpm run build --mode "$ENVIRONMENT"
                pnpm exec electron-builder --win
              '''
            archiveArtifacts(artifacts: 'dist/*.exe,dist/*.blockmap,dist/latest*.yml', fingerprint: true)
          }
        }
      }
    }

    stage('构建 Web 资源包') {
      when {
        expression { params.PLATFORM == 'web' }
      }
      steps {
        sh '''
            pnpm run build:renderer --mode "$ENVIRONMENT"
          '''
        archiveArtifacts(artifacts: 'dist/renderer-*.zip', fingerprint: true)
      }
    }
  }

  post {
    always {
      script {
        dingTalkNotifier?.send()
      }
    }
  }
}
