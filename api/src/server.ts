import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { APIError, logger } from '@p0/common'

import { config } from './core/index.js'
import notchMw from './middlewares/notch.js'
// import errorMw from './middlewares/errors.js'
import routes from './routes/index.js'
import { init as initWSS } from './services/wss.js'
import { scheduledRules } from './services/scheduled-rules.js'

//  ---------------------------------
//  the last frontier

process.on('unhandledRejection', (reason: unknown): never => {
  if (reason instanceof Error) {
    // Erros does not contain visible properties
    logger.error('unhandledRejection', reason.message, reason.stack)
  } else {
    logger.error('unhandledRejection', reason)
  }
  throw reason
})

process.on('uncaughtException', (error: APIError): void => {
  logger.fatal('uncaughtException', error.message, error.stack)
  if (config.env === 'production' && (error.fatal || error.fatal === undefined)) {
    process.exit(666)
  }
})

//  ---------------------------------
//  servers

const app = express()

//  ---------------------------------
//  middlewares

app.use((req, res, next) => {
  const src = `${req.ip}:${req.socket.remotePort}`
  const url = `${req.method} ${req.protocol}://${req.hostname}:${req.socket.localPort}${req.originalUrl}`
  logger.http(src, url/* , JSON.stringify(req.headers) */)
  next()
  // res.on('finish', () => {
  //   logger.http(src, url, JSON.stringify(req.headers), res.statusCode)
  // })
})

const corsMw = cors({
  origin: true,
  credentials: true,
  methods: 'OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE'
  // methods: 'GET'
})
app.use(corsMw)
app.options('*', corsMw)

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(notchMw)

//  mount routes to the application
app.use(routes)

//  ---------------------------------
//  start some crontab jobs
scheduledRules.schedule()

//  ---------------------------------
//  and here we go ...

app.listen(config.port, '0.0.0.0', async () => {
  logger.info(
    `API Server started, listening on port ${config.port}, project: ${config.name}, version: ${config.version}, API ${config.api || '[not set]'}, ${config.description}, environment: ${config.env}`
  )
})

initWSS(config.wsPort)
