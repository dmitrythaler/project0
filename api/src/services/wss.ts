import { getEventListeners, EventEmitter } from 'node:events'
import { WebSocketServer, WebSocket } from 'ws'
import {
  HEARTBEAT_STR,
  HEARTBEAT_INTERVAL,
  WSS_AUTH_TIMEOUT,
  WS_LOGIN,
  WS_LOGOUT,
  // STATUS_LOADED,
  APIError,
  logger
} from '@p0/common'
import { getStatus } from '../controllers/status.ts'
import { jwt, config } from '../core/index.ts'

import type { AppEvent, AppAction } from '@p0/common/types'
import type * as T from 'ws'
import type { IncomingMessage } from 'node:http'

//  ----------------------------------------------------------------------------------------------//

const clearEventListeners = (ee: EventEmitter, ev: string) => {
  getEventListeners(ee, ev).forEach(cb => ee.off(ev, cb as ((...args: any[]) => void)))
}

type WebSocketExt = WebSocket & {
  isAlive: boolean
  clientIp: string
  userId?: string
}

//  ---------------------------------
class WSServer {
  private port: number = 0
  private wss: WebSocketServer|null = null
  private clients: WebSocketExt[] = []

  private initWSx(wsx: WebSocketExt, clientIp: string) {
    wsx.isAlive = true
    wsx.clientIp = clientIp
    wsx.on('pong', () => {
      wsx.isAlive = true
    })
    wsx.on('close', () => {
      logger.wss(`WSS connection ${wsx.clientIp} closed.`)
    })
    wsx.on('message', async (data: T.Data) => {
      data = typeof data !== 'string' ? data.toString() : data
      try {
        const { action, wsToken } = JSON.parse(data)
        logger.wss(`WSS data received from ${clientIp}:`, action)
        const { id: userId } = jwt.verify(wsToken) as { id: string }
        if (action === WS_LOGIN) {
          wsx.userId = userId
          wsx.emit('login', this)
        } else if (action === WS_LOGOUT) {
          wsx.emit('logout', this)
        } else {
          logger.error(`WSS ${clientIp} (id: ${userId}), wrong action "${action}"`)
        }
      } catch (error) {
        logger.error('WSS received data parsing error', error)
      }
    })
  }

  private closeWSx(wsx: WebSocketExt) {
    wsx.isAlive = false
    clearEventListeners(wsx, 'pong')
    clearEventListeners(wsx, 'close')
    clearEventListeners(wsx, 'message')
    clearEventListeners(wsx, 'login')
    clearEventListeners(wsx, 'logout')
    if (wsx.readyState === WebSocket.OPEN) {
      wsx.close()
    } else {
      wsx.terminate()
    }
  }

  private loginClient(wsx: WebSocketExt) {
    const foundIdx = this.clients.findIndex(c => c.userId === wsx.userId)
    if (foundIdx !== -1) {
      this.closeWSx(this.clients[foundIdx])
      this.clients[foundIdx] = wsx
      logger.wss(`WSS ${wsx.clientIp} (id: ${wsx.userId}), client replaced`)
    }
    else {
      this.clients.push(wsx)
      logger.wss(`WSS ${wsx.clientIp} (id: ${wsx.userId}), client authenticated, clients num ${this.clients.length}`)
    }
  }

  constructor(port: number) {
    this.port = port
  }

  close() {
    if (this.wss) {
      this.clients.forEach(client => {
        this.closeWSx(client)
      })
      this.clients = []
      this.wss.close(() => {
        this.wss = null
      })
    }
  }

  start() {
    if (this.wss) {
      return
    }
    this.wss = new WebSocketServer({ host: '0.0.0.0', port: this.port })
    this.wss.on('listening', () => {
      logger.info(`WSS Server started, listening on port ${this.port}`)
    })
    this.wss.on('error', (err: T.ErrorEvent) => {
      logger.error('WSS error', err)
    })

    // new connection
    this.wss.on('connection', async (wsx: WebSocketExt, req: IncomingMessage): Promise<void> => {
      const clientIp = req.socket.remoteAddress
      logger.wss('WSS new connection:', clientIp)
      this.initWSx(wsx, clientIp || '[unknown]')

      // after initial connection cliend must send auth token within WSS_AUTH_TIMEOUT ms
      const terminatorId = setTimeout(() => {
        wsx.terminate()
        logger.warn(`WSS connection ${clientIp} terminated due to login timeout`)
      }, WSS_AUTH_TIMEOUT)

      wsx.on('login', () => {
        clearTimeout(terminatorId)
        this.loginClient(wsx)
      })
      wsx.on('logout', () => {
        this.closeClient(wsx.userId!)
      })
    })

    //  ping/pong/heartbeat every client every HEARTBEAT_INTERVAL ms
    const heartBeat = setInterval(() => {
      this.clients.forEach(client => {
        if (client.isAlive === false) {
          return this.closeWSx(client)
        }
        client.isAlive = false
        client.ping()
        client.send(HEARTBEAT_STR)
      })
    }, HEARTBEAT_INTERVAL)

    this.wss.on('close', () => {
      clearInterval(heartBeat)
    })
  }

  broadcast(data: AppAction): void {
    if (!this.wss) {
      throw new APIError(500, 'WebSocketServer is not initialized yet!')
    }

    try {
      this.clients.forEach((wsx) => {
        if (wsx.readyState === WebSocket.OPEN) {
          wsx.send(JSON.stringify(data))
        }
      })
    } catch (error) {
      throw new APIError(<Error>error)
    }
  }

  closeClient(userId: string) {
    const clientIdx = this.clients.findIndex(c => c.userId === userId)
    if (clientIdx !== -1) {
      this.closeWSx(this.clients[clientIdx])
      this.clients.splice(clientIdx, 1)
      logger.wss(`WSS connection with client ${userId} closing.`, this.clients.length)
    }
  }

  //  ---------------------------------
  private static inst_: WSServer|null = null
  static getInstance = (port: number = config.wsPort) =>
    WSServer.inst_ || (WSServer.inst_ = new WSServer(port))
}

export const getWss = WSServer.getInstance
