import { context } from 'esbuild'
import chokidar from 'chokidar'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import conf from './esbuild.config.js'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '../dist')
const NODE_ENV = process.env.NODE_ENV
const FE_PORT = parseFloat(process.env.FE_PORT || '3000')

//  ---------------------------------

class DevServer {
  constructor(conf) {
    this.conf = conf
    this.ctx = null
    this.server = null
    this.sse = null

    //  bare minimal static app
    const app = express()
    app.use((req, res, next) => {
      console.log('DEV-SERVER:', req.method, req.originalUrl)
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
    app.get('/dev-server', (req, res) => this.sseHandler(req, res))
    app.get('*', (req, res) => {
      res.sendFile(join(DIST, '/index.html'))
    })

    this.app = app
  }

  sseHandler(req, res/* , next */) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    res.write('id: 0\ndata: SSE connection established\n\n')
    this.sse = res
    console.log('DEV-SERVER: SSE connection established')
    req.on('close', () => {
      console.log('DEV-SERVER: SSE connection closed')
    });
  }

  sseSend(data) {
    this.sse && this.sse.write(`event: update\nid: ${Date.now()}\ndata: ${data}\n\n`)
  }

  start() {
    this.server = this.app.listen(FE_PORT, () => {
      console.log(`DEV-SERVER: start, port ${FE_PORT}, env: ${NODE_ENV || '[not set]'}`)
    })
  }

  async rebuild(path) {
    this.server && this.server.close()
    if (!this.ctx) {
      this.ctx = await context(this.conf)
    }

    const { errors } = await this.ctx.rebuild()
    if (errors.length === 0) {
      try {
        this.start()
        console.log('DEV_SERVER: rebuild done')
        this.sseSend(path)
      } catch (error) {
        errors.push(error)
      }
    }

    if (errors.length !== 0) {
      console.error('DEV_SERVER: rebuild failed:', errors)
      console.log('  + waiting for the source changes ...')
    }
  }
}

; (async () => {
  const server = new DevServer(conf)
  await server.rebuild()

  chokidar
    .watch('src')
    .on('change', async (path) => {
      console.log(`DEV-SERVER: file "${path}" changed`)
      await server.rebuild(path)
    })
})()
