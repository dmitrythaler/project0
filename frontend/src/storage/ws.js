import config from '../config'

export const BRANCH = 'WS'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

export const WS_RECEIVED = 'WS/RECEIVED'
export const WS_CONNECTED = 'WS/CONNECTED'

//  ---------------------------------
//  selectors

export function getEvent(state) {
  return state[BRANCH].payload
}

//  ----------------------------------------------------------------------------------------------//

const HEARTBEAT_STR = 'HEARTBEAT'
const HEARTBEAT_INTERVAL = 3000
const WEBSOCKET_URL = `${config.wsProtocol}//${config.hostname}:${config.api.wsPort}`

class WebSocketExt {
  ws = null
  heartbeat = null
  url = ''
  _onopen = null
  _onmessage = null
  _onclose = null
  _onerror = null

  constructor(url) {
    this.url = url
    this.init()
  }

  init() {
    clearTimeout(this.heartbeat)
    this.ws && this.ws.close()
    this.ws = new WebSocket(this.url)
    this.ws.onopen = event => {
      this._onopen && this._onopen(event)
    }

    this.ws.onmessage = event => {
      let payload = event?.data
      if (payload === HEARTBEAT_STR) {
        // console.log(HEARTBEAT_STR)
        clearTimeout(this.heartbeat)
        this.heartbeat = setTimeout(() => {
          this.ws.close()
          this.ws = null
          this.init()
        }, HEARTBEAT_INTERVAL + 1000)
        return
      }

      try {
        payload = JSON.parse(payload)
      } catch (error) {
        payload = event
      }
      this._onmessage && this._onmessage(payload)
    }

    this.ws.onclose = () => {
      console.log('WebSocketExt closed, trying to reconnect')
      this.init()
    }
    this.ws.onerror = e => {
      console.error('WebSocketExt error', e)
    }

  }

  set onopen(handler) { this._onopen = handler }
  set onmessage(handler) { this._onmessage = handler }
  set onclose(handler) { this._onclose = handler }
  set onerror(handler) { this._onerror = handler }
}

const ws = new WebSocketExt(WEBSOCKET_URL)

//  ---------------------------------
export function initWebSocket(store) {
  ws.onopen = () => {
    store.dispatch({ type: WS_CONNECTED })
  }
  ws.onmessage = payload => {
    store.dispatch({ type: WS_RECEIVED, payload })
  }
}


//  ----------------------------------------------------------------------------------------------//
//  redicer

export default function reducer(state = { event: '', payload: {} }, action) {
  switch (action.type) {
    case WS_RECEIVED: {
      return { event: action.type, payload: action.payload }
    }

    case WS_CONNECTED: {
      return { event: action.type, payload: {} }
    }

    default:
      return state
  }
}

