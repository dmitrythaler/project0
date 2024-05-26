import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'

import {
  THEME_BRANCH,
  MSGS_BRANCH,
  STATUS_BRANCH,
  USERS_BRANCH,
  MEDIA_BRANCH,
  SESSION_BRANCH,
  EVENTS_BRANCH,
} from '@p0/common/constants'

import themeReducer from './reducers/theme.ts'
import messageReducer from './reducers/messages.ts'
import statusReducer from './reducers/status.ts'
import usersReducer from './reducers/users.ts'
import mediaReducer from './reducers/media.ts'
import sessionReducer from './reducers/session.ts'
import eventsReducer from './reducers/events.ts'

//  ---------------------------------

// this const is being kept by esbuild
declare const SHARED_CONF__PRODUCTION: boolean

const rootReducer = combineReducers({
  [THEME_BRANCH]: themeReducer,
  [MSGS_BRANCH]: messageReducer,
  [STATUS_BRANCH]: statusReducer,
  [USERS_BRANCH]: usersReducer,
  [MEDIA_BRANCH]: mediaReducer,
  [SESSION_BRANCH]: sessionReducer,
  [EVENTS_BRANCH]: eventsReducer,
})

export const store = configureStore({
  reducer: rootReducer,
  devTools: !SHARED_CONF__PRODUCTION,
})

//  ---------------------------------
//  types
export type AppStore = typeof store
export type AppDispatch = typeof store.dispatch
export type AppReducer = typeof rootReducer
export type AppState = ReturnType<AppReducer>

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<AppState>()


//  ----------------------------------------------------------------------------------------------//
//  interseption

// debug MW to console.log every action
// const watcher: Middleware<{}, ReturnType<typeof rootReducer>> = store => {
//   console.log('+++ STORE WATCHER: store creation', store.getState())

//   return next =>
//     (action: unknown) => {
//       console.groupCollapsed('+ Store watcher:', action.type)
//       console.log(action)
//       const res = next(action)
//       console.log('next State:', store.getState())
//       console.groupEnd()
//       return res
//     }
// }

// const interceptorMw: Middleware<{}, ReturnType<typeof rootReducer>> = () => {
//   return next =>
//     (action: UnknownAction) => {
//       getStack().push(action)
//       const res = next(action)
//       getStack().pop()
//       return res
//     }
// }

// //  ---------------------------------
// //  Redux store

// export const store_ = createStore(
//   rootReducer,
//   (SHARED_CONF__PRODUCTION ? applyMiddleware(thunk, interceptorMw) : applyMiddleware(thunk, interceptorMw, watcher))
// )

// getWs(store).subscribe()
// getSessionMonitor(store).subscribe()
// eventsSubscribe(store)

