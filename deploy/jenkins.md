# Jenkins 构建配置

`electron-base` 使用同一个 Jenkins Pipeline Job 自动接收 GitHub 推送，也支持手动选择远端分支打包。构建配置放在 [Jenkinsfile.groovy](./Jenkinsfile.groovy)。

## GitHub Webhook 自动构建

### 配置 Jenkins

1. 在 **Manage Jenkins → Plugins** 安装并启用 **Generic Webhook Trigger**（`generic-webhook-trigger`）。首次运行 Jenkinsfile 前，也需要启用下文的 Git Parameter 插件。 [Generic Webhook Trigger](https://plugins.jenkins.io/generic-webhook-trigger/)
2. 在 **Manage Jenkins → Credentials** 中添加 **Secret text** 凭据。ID 填 `electron-base-webhook-token`，对应 Jenkinsfile 的 `tokenCredentialId`。在 macOS 上可用 `openssl rand -hex 32 | pbcopy` 生成随机值并复制到剪贴板。 [Jenkins 凭据文档](https://www.jenkins.io/doc/book/using/using-credentials/#adding-new-global-credentials)
3. Job 的 **Pipeline** 使用 **Pipeline script from SCM**，SCM 选 **Git**，仓库设为 `https://github.com/ccBreeze/electron-base`，并选择可读取仓库的 Git 凭据。可用 **Branch Specifier** `*/ci/jenkins` 固定脚本来源，**Script Path** 填 `deploy/Jenkinsfile.groovy`。
4. 推送 Jenkinsfile 后手动运行 Job 一次，让 Jenkins 注册触发器和构建参数。 [Pipeline 触发器注册说明](https://plugins.jenkins.io/generic-webhook-trigger/#pipeline)

### 配置 GitHub

进入仓库的 **Settings → Webhooks**，创建或编辑这条 Webhook。将示例地址换成 GitHub 可访问的 Jenkins 地址，并把 `YOUR_WEBHOOK_TOKEN` 换成 **Secret text 的内容**。 [GitHub Webhook 配置文档](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks)

| 字段         | 配置                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| Payload URL  | `https://jenkins.example.com/generic-webhook-trigger/invoke?token=YOUR_WEBHOOK_TOKEN` |
| Content type | `application/json`                                                                    |
| Events       | **Just the push event**                                                               |
| Active       | 勾选                                                                                  |

这套配置使用 URL 中的 `token` 匹配 Jenkins 凭据。GitHub 表单里的 **Secret** 用于 HMAC 签名。在 Jenkins 接收端配置相应验签后，才会校验该签名。 [插件 Token 配置](https://plugins.jenkins.io/generic-webhook-trigger/#token-parameter) · [GitHub 签名验证](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)

### 匹配分支并验证

Jenkinsfile 只接受向 `main` 和 `ci/jenkins` 推送代码的事件。触发器根据 `deleted`、`ref` 和 `after` 过滤，删除分支和推送 tag 的事件会被过滤。 [GitHub push 事件字段](https://docs.github.com/en/webhooks/webhook-events-and-payloads#push)

```groovy
regexpFilterText: '$WEBHOOK_DELETED $WEBHOOK_REF $WEBHOOK_COMMIT',
regexpFilterExpression: '^false refs/heads/(?:main|ci/jenkins) [0-9a-f]{40}$'
```

触发器从 `ref` 提取分支名写入 `BRANCH`，并将 `after` 写入 `WEBHOOK_COMMIT`。打包阶段按这次推送的 **commit SHA** 检出代码，后续推送更新分支头也不会改变这次构建的提交。脚本来源仍是 Job 配置的 CI 分支。

验证时，分别向两个分支推送一个新提交。在 GitHub **Recent Deliveries** 中确认对应的 `push` 投递成功，再在 Jenkins 构建原因和控制台里核对分支及 SHA。当前自动构建默认使用 **Windows UAT**。同一个 Job 的新构建会取消仍在运行的上一条构建，验证两个结果时可等第一次结束再推送第二次。 [GitHub 投递记录说明](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/viewing-webhook-deliveries)

## Git Parameter 动态加载手动构建分支

在 **Manage Jenkins → Plugins** 安装并启用 **Git Parameter**（`git-parameter`）。插件根据 Job 的 Git SCM 配置动态读取远端分支。Jenkinsfile 中的 `BRANCH` 参数配置如下。 [Git Parameter 配置文档](https://plugins.jenkins.io/git-parameter/)

```groovy
gitParameter(
  name: 'BRANCH',
  type: 'PT_BRANCH',
  branchFilter: 'origin/(.*)',
  defaultValue: 'ci/jenkins',
  selectedValue: 'DEFAULT',
  listSize: '1',
  quickFilterEnabled: true,
  description: '选择要构建的代码分支'
)
```

| 配置                              | 用途                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `type: 'PT_BRANCH'`               | 列出 Jenkins 有权限读取的远端分支。                                                       |
| `branchFilter: 'origin/(.*)'`     | 用捕获组去掉 `origin/` 前缀。例如 `origin/feat/app-update` 的参数值是 `feat/app-update`。 |
| `defaultValue` 与 `selectedValue` | 默认选中 `ci/jenkins`。                                                                   |
| `listSize: '1'`                   | 将分支列表显示为单行下拉框。                                                              |
| `quickFilterEnabled: true`        | 显示独立的 **Filter** 输入框，可输入关键词筛选分支。                                      |

Jenkins 运行一次新版 Jenkinsfile 后，重新打开 **Build with Parameters**。选择分支、平台和环境后点击 **Build**，流水线会按所选分支检出代码。远端分支列表用于手动选分支，Webhook 的自动构建范围由上面的匹配规则控制。

## Jenkins 共享库

https://my.oschina.net/emacs_7991204/blog/19216099
