import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { APIError, logger } from '@p0/common'
import { getDAL } from '@p0/dal'

import { config } from './core/index.ts'
import notchMw from './middlewares/notch.ts'
import routes from './routes/index.ts'
import { getWss } from './services/wss.ts'

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

type App = ReturnType<typeof express>
type Server = ReturnType<App['listen']>
type Config = typeof config

class API {
  private config: Config
  private app: App
  private server: Server|null

  constructor (config: Config) {
    this.config = config
    this.app = express()
    this.server = null

    // MWs
    this.app.use((req, res, next) => {
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
    this.app.use(corsMw)
    this.app.options('*', corsMw)

    this.app.use(cookieParser())
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(notchMw)

    //  mount routes to the application
    this.app.use(routes)
  }

  start() {
    this.server = this.app.listen(this.config.port, '0.0.0.0', async () => {
      logger.info(
        `API Server started, listening on port ${this.config.port}, project: ${this.config.name}, version: ${this.config.version}, API ${this.config.api || '[not set]'}, ${this.config.description}, environment: ${this.config.env}`
      )
    })
    getWss().start()
    getDAL().init()
  }

  close() {
    this.server?.close()
    getWss().close()
  }
}

//  ---------------------------------
//  and here we go ...
const api = new API(config)
api.start()

export { api }
