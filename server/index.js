const express = require('express')
const app = express()
const path = require('path')
const cors = require('cors')

// 设置静态资源目录
const staticDir = path.join(__dirname, 'static')

app.use(cors())
// 使用express.static()中间件来指定静态资源目录
app.use(express.static(staticDir))

app.get('/api/version', (req, res) => {
  // 返回版本信息
  res.status(200).json({
    currentVersion: '1.0.0.1',
  })
})

// 监听8080端口
app.listen(8080, () => {
  console.log('Server running at http://localhost:8080/')
})
