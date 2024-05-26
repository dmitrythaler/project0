import { store } from './store'
import { cookieWatcher } from './utils'
import { getSessionWatcher } from './session-watcher'

//  ---------------------------------
cookieWatcher(store)
getSessionWatcher(store).subscribe()

//  ---------------------------------
export {
  store,
  useAppDispatch,
  useAppSelector
} from './store'

export * as ThemeState from './states/theme'
export * as MessagesState from './states/messages'
export * as StatusState from './states/status'
export * as UsersState from './states/users'
export * as MediaState from './states/media'
export * as SessionState from './states/session'
export * as EventsState from './states/events'

export type * from './store'

