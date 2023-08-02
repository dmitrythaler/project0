import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { context/* , build */ } from 'esbuild'
import chokidar from 'chokidar'

import conf from './esbuild.config.js'
import { builder as commonBuilder } from '@p0/common/tools/bundler.js'
import { builder as dalBuilder } from '@p0/dal/tools/bundler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../')

//  ---------------------------------

class DevServer {

  constructor(conf) {
    this.ctx = null
    this.conf = conf
    this.server = null
  }

  async kill(sig = 15) {
    if (this.server) {
      return new Promise((res) => {
        this.server.on('close', (code) => {
          res(true)
          this.server = null
        })
        this.server.kill(sig)
      })
    }
  }

  async rebuild() {
    if (!this.ctx) {
      this.ctx = await context(this.conf)
    }
    const { errors } = await this.ctx.rebuild()
    const ok = errors.length === 0
    if (!ok) {
      console.error('DEV_SERVER: rebuild failed:', errors)
      console.log('  + waiting for the source changes ...')
    } else {
      console.log('DEV_SERVER: rebuild done')
    }
    return ok
  }

  async restart() {
    await this.kill()
    try {
      this.server = spawn('node',
        ['--experimental-specifier-resolution=node', `${root}dist/server.js`], {
        cwd: root
      })
      this.server.stdout.on('data', (data) => console.log(data.toString().slice(0, -1)))
      this.server.stderr.on('data', (data) => console.error(data.toString().slice(0, -1)))
      this.server.on('close', (code) => {
        console.log(`DEV_SERVER: child process exited with code ${code}`)
      })
      this.server.on('error', (err) => {
        console.error(`DEV_SERVER: child process error`, err)
      })
      console.log('DEV_SERVER: restarted')
    } catch (error) {
      console.error('DEV_SERVER: restart failed:', error)
    }
  }
}


(async () => {
  let server = new DevServer(conf)
  await server.rebuild()
  await server.restart()

  chokidar
    .watch([
      "src/**"
    ])
    .on('change', async (path) => {
      console.log(`DEV_SERVER: file "${path}" changed`)
      const res = await server.rebuild()
      res && (await server.restart())
    })

  chokidar
    .watch([
      "../common/*.ts"
    ])
    .on('change', async (path) => {
      console.log(`DEV_SERVER: file "${path}" changed`)
      await commonBuilder()
      await server.restart()
    })

  chokidar
    .watch([
      "../dal/models",
      "../dal/index.ts"
    ])
    .on('change', async (path) => {
      console.log(`DEV_SERVER: file "${path}" changed`)
      await dalBuilder()
      await server.restart()
    })

})()
