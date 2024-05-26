import {
  SESSION_STARTED,
  SESSION_ENDED,
  SESSION_UPDATED,
} from '@p0/common/constants'
import { sessionExpiredAction } from './reducers/session'
import { sendMessage } from './states/messages'
import { getStack } from './actionsstack'

import type { SessionData } from './reducers/session'
import type { AppStore } from './store'

//  ---------------------------------

//  Session monitoring class
class SessionWatcher {
  private timer: NodeJS.Timeout | null = null
  private store: AppStore

  constructor(store: AppStore) {
    this.store = store
    this.timer = null
  }

  private reset(exp: number | null) {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    if (!exp) {
      this.timer = null
      return
    }
    this.timer = setTimeout(() => {
      this.store.dispatch(sessionExpiredAction())
      this.store.dispatch(sendMessage({
        header: 'Session expired',
        body: 'Session is expired due to inactivity. Please login again.',
        timeout: 0
      }))
    }, exp - Date.now())
  }

  subscribe() {

    // subscribe to handle actions created outside of Session
    this.store.subscribe(() => {
      const action = getStack().top()
      if (action?.type === SESSION_STARTED) {
        const { exp } = action.payload as SessionData['data']
        this.reset(exp)
      } else if (action?.type === SESSION_UPDATED) {
        const exp = action.payload
        this.reset(exp)
      } else if (action?.type === SESSION_ENDED) {
        this.reset(0)
      }
    })
  }

  //  ---------------------------------
  private static inst_: SessionWatcher | null = null
  static getSessionWatcher = (store: AppStore): SessionWatcher => SessionWatcher.inst_ || (SessionWatcher.inst_ = new SessionWatcher(store))
}

export const getSessionWatcher = SessionWatcher.getSessionWatcher

