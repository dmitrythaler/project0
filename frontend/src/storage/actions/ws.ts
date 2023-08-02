import {
  WS_BRANCH as BRANCH,
  WS_CONNECTED,
  WS_RECEIVED,
  WS_CLOSED,
  WS_LOGIN,
  WS_LOGOUT,
  HEARTBEAT_STR,
  HEARTBEAT_INTERVAL,
  SESSION_LOADED,
  SESSION_STARTED,
  SESSION_EXPIRED,
  SESSION_ENDED,
} from '@p0/common/constants'
import config from '@common'
import { getStack } from '../actionsstack'

import type { AppAction } from '@common/types'
import type { AppStore } from '../store'

//  ----------------------------------------------------------------------------------------------//
// class WSExt - simple singleton WebSocket wrapper with heartbeat support

class WSExt {
  private store: AppStore
  private ws: WebSocket|null = null
  private heartbeat: NodeJS.Timeout|number = 0
  private url = ''
  private wsToken: string | null = null

  constructor(url: string, store: AppStore) {
    this.store = store
    this.url = url
  }

  close() {
    clearTimeout(this.heartbeat)
    if (!this.ws) {
      return
    }
    this.ws.onclose = null
    this.ws.onopen = null
    this.ws.onmessage = null
    this.ws.onerror = null
    if (this.ws.readyState === WebSocket.OPEN) {
      if (this.wsToken) {
        this.ws.send(JSON.stringify({ action: WS_LOGOUT, wsToken: this.wsToken }))
      }
      this.ws.close()
    }
    this.ws = null
    this.wsToken = null
    this.store.dispatch({ type: WS_CLOSED })
  }

  init() {
    this.close()
    if (!this.wsToken) {
      console.error('WS error - non-authenticated connect')
      return
    }
    this.ws = new WebSocket(this.url)
    this.ws.onopen = (event: Event) => {
      this.store.dispatch({ type: WS_CONNECTED })
      if (this.ws && this.wsToken) {
        this.ws.send(JSON.stringify({ action: WS_LOGIN, wsToken: this.wsToken }))
      }
    }
    this.ws.onmessage = (event: MessageEvent) => {
      let payload: string = event?.data
      if (payload === HEARTBEAT_STR) {
        clearTimeout(this.heartbeat)
        this.heartbeat = setTimeout(() => {
          this.init()
        }, HEARTBEAT_INTERVAL + 1000)
        return
      }

      try {
        const action = JSON.parse(payload) as AppAction
        this.store.dispatch(action)
        this.store.dispatch({ type: WS_RECEIVED, payload: action })
      } catch (error) {
        console.error('WS payload error', error)
      }
    }
    this.ws.onclose = (ev: CloseEvent) => {
      if (this.wsToken) {
        this.init()
      }
    }
    this.ws.onerror = e => {
      console.error('WS error', e)
    }
  }

  subscribe() {
    // subscribe to handle actions created outside of Session
    this.store.subscribe(() => {
      // const action: AnyAction = this.store.getState().LAST_ACTION
      const action = getStack().top()
      if (action?.type === SESSION_STARTED || action?.type === SESSION_LOADED) {
        const { wsToken } = action.payload
        this.wsToken = wsToken
        this.init()
      } else if (action?.type === SESSION_ENDED || action?.type === SESSION_EXPIRED) {
        this.close()
      }
    })
  }

  //  ---------------------------------
  private static inst_: WSExt | null = null
  static getWs = (store: AppStore): WSExt =>
    WSExt.inst_ || (WSExt.inst_ = new WSExt(
      `${config.wsProtocol}//${config.hostname}:${config.api.wsPort}`,
      store
    ))
}

//  ---------------------------------

export const getWs = WSExt.getWs
