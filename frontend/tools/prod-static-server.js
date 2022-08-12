//  server to test production bundle
const path = require('path')
const express = require('express')
const cors = require('cors')

const { createLogger } = require('lean-logger')
const logger = createLogger()

const DIST = path.resolve(__dirname, '../dist')
const { PORT, FE_PORT, NODE_ENV } = process.env
const port = FE_PORT || PORT || 3000

//  bare minimal static app
const app = express()

app.use((req, res, next) => {
  logger.http(req.ip, req.method, req.protocol, req.hostname, req.originalUrl)
  next()
})

const corsMw = cors({
  origin: true,
  credentials: true,
  methods: 'OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE'
})
app.use(corsMw)
app.options('*', corsMw)

app.use(express.static(DIST))

app.get('*', (req, res) => {
  res.sendFile(path.join(DIST, '/index.html'))
})

app.listen(port, () => {
  logger.fe( ` Server started, listening on port ${port}` )
  logger.fe( ` Environment: ${NODE_ENV || '[not set]'}\n` )
})
