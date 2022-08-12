
import { WebSocketServer, WebSocket } from 'ws'
import { APIError, logger } from '@p0/common'
import { getStatus } from '../controllers/status.js'

import type { Keyed } from '@p0/common'
import type * as T from 'ws'
import type { Request } from 'express'

//  ----------------------------------------------------------------------------------------------//

const HEARTBEAT_STR = 'HEARTBEAT'
const HEARTBEAT_INTERVAL = 3000

/**
 * @small wrapper around WebSocket server
 *
 */

let wss: WebSocketServer
declare class WebSocketExt extends T.WebSocket {
  isAlive: boolean
}

export const init = (port: number): void => {
  if (wss) {
    return
  }

  wss = new WebSocketServer({
    host: '0.0.0.0',
    port
  })

  wss.on('listening', () => {
    logger.info(`WSS Server started, listening on port ${port}`)
  })

  wss.on('connection', async (ws: WebSocket, req: Request): Promise<void> => {
    logger.info('WSS connected:', req.socket.remoteAddress);

    (<WebSocketExt>ws).isAlive = true
    ws.on('message', (data: T.Data) => {
      logger.info('WSS received: %s', data)
    })
    ws.on('pong', () => {
      (<WebSocketExt>ws).isAlive = true
    })

    const status = await getStatus()
    ws.send(JSON.stringify({
      source: 'SYSTEM',
      event: 'STATUS/UPDATE',
      data: status
    }))
  })

  wss.on('error', (err: T.ErrorEvent) => {
    logger.error('WSS error', err)
  })

  const heartBeat = setInterval(() => {
    wss.clients.forEach(ws => {
      if ((<WebSocketExt>ws).isAlive === false) {
        return ws.terminate()
      }

      (<WebSocketExt>ws).isAlive = false
      ws.ping()
      ws.send(HEARTBEAT_STR)
    })
  }, HEARTBEAT_INTERVAL)

  wss.on('close', () => {
    clearInterval(heartBeat)
  })
}

export const broadcast = (data: Keyed): void => {
  if (!wss) {
    throw new APIError(500, 'WebSocketServer is not initialized yet!')
  }

  try {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data))
      }
    })
  } catch (error) {
    throw new APIError(<Error>error)
  }
}

