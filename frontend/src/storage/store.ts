import { createStore, combineReducers, applyMiddleware } from 'redux'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import thunk from 'redux-thunk'
import type { Middleware, AnyAction } from 'redux'
import type { ThunkAction, ThunkDispatch } from 'redux-thunk'

import * as Theme from './reducers/theme'
import * as Messages from './reducers/messages'
import * as AppStatus from './reducers/status'
import * as Users from './reducers/users'
import * as Media from './reducers/media'
import * as Session from './reducers/session'
import * as Events from './reducers/events'
import {
  THEME_BRANCH,
  MSGS_BRANCH,
  SESSION_BRANCH,
  STATUS_BRANCH,
  EVENTS_BRANCH,
  USERS_BRANCH,
  MEDIA_BRANCH,
} from '@p0/common/constants'

import { getWs } from './actions/ws'
import { getSession } from './actions/session'
import { subscribe as eventsSubscribe } from './actions/events'
import { getStack } from './actionsstack'

// this const is being kept by esbuild
declare const SHARED_CONF__PRODUCTION: boolean

//  ----------------------------------------------------------------------------------------------//
//  interseption

const rootReducer = combineReducers({
  [THEME_BRANCH]: Theme.reducer,
  [MSGS_BRANCH]: Messages.reducer,
  [STATUS_BRANCH]: AppStatus.reducer,
  [USERS_BRANCH]: Users.reducer,
  [MEDIA_BRANCH]: Media.reducer,
  [SESSION_BRANCH]: Session.reducer,
  [EVENTS_BRANCH]: Events.reducer,
})

// debug MW to console.log every action
const watcher: Middleware<{}, ReturnType<typeof rootReducer>> = store => {
  console.log('+++ STORE WATCHER: store creation', store.getState())

  return next =>
    action => {
      console.groupCollapsed('+ Store watcher:', action.type)
      console.log(action)
      const res = next(action)
      console.log('next State:', store.getState())
      console.groupEnd()
      return res
    }
}

const interceptorMw: Middleware<{}, ReturnType<typeof rootReducer>> = (store) => {
  return next =>
    action => {
      getStack().push(action)
      const res = next(action)
      getStack().pop()
      return res
    }
}

//  ---------------------------------
//  Redux store

export const store = createStore(
  rootReducer,
  (SHARED_CONF__PRODUCTION ? applyMiddleware(thunk, interceptorMw) : applyMiddleware(thunk, interceptorMw, watcher))
)

getWs(store).subscribe()
getSession(store).subscribe()
eventsSubscribe(store)


//  ---------------------------------
//  types

export type AppStore = typeof store
export type RootState = ReturnType<typeof rootReducer>

export type AppDispatch = typeof store.dispatch
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>
export type AppThunkDispatch = ThunkDispatch<RootState, unknown, AnyAction>

type DispatchFunc = () => AppThunkDispatch
export const useAppDispatch: DispatchFunc = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
