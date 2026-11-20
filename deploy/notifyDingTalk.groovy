def send(String status = null) {
  def robotId = env.DINGTALK_ROBOT_ID?.trim()
  if (!robotId) {
    echo '未配置 DINGTALK_ROBOT_ID，跳过钉钉通知。'
    return
  }

  status = status ?: currentBuild.currentResult
  def statusStyles = [
    STARTED: [label: '开始构建', icon: '🚀', color: '#1677FF'],
    SUCCESS: [label: '构建成功', icon: '✅', color: '#15803D'],
    FAILURE: [label: '构建失败', icon: '❌', color: '#DC2626'],
    UNSTABLE: [label: '构建不稳定', icon: '⚠️', color: '#B45309'],
    ABORTED: [label: '构建已中止', icon: '⏹️', color: '#6B7280'],
    NOT_BUILT: [label: '未构建', icon: '⏭️', color: '#7C3AED']
  ]
  def statusStyle = statusStyles[status] ?: [label: '未知状态', icon: 'ℹ️', color: '#6B7280']

  catchError(buildResult: 'SUCCESS', catchInterruptions: false, message: '钉钉通知发送失败') {
    def duration = '-'
    if (status != 'STARTED') {
      def totalSeconds = Math.floorDiv(currentBuild.duration, 1000L)
      def minutes = Math.floorDiv(totalSeconds, 60L)
      duration = "${Math.floorMod(totalSeconds, 60L)} 秒"
      if (minutes > 0) {
        duration = "${minutes} 分 ${duration}"
      }
    }

    def userCause = currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause').find { it.userName }

    dingtalk(
      robot: robotId,
      type: 'MARKDOWN',
      title: "${statusStyle.icon} ${env.JOB_NAME} #${env.BUILD_NUMBER} ${statusStyle.label}",
      text: [
        "### ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        "状态：${statusStyle.icon} **<font color=${statusStyle.color}>${statusStyle.label}</font>**",
        '',
        "- 构建平台：${params.PLATFORM}",
        "- 构建环境：${params.ENVIRONMENT}",
        "- 持续时间：${duration}",
        "- 执行人：${userCause?.userName ?: '自动触发'}",
        '',
        "[查看 Jenkins 构建详情](${env.BUILD_URL})"
      ]
    )
  }
}

return this
