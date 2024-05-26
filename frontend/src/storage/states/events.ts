import {
  EVENTS_BRANCH as BRANCH,
} from '@p0/common/constants'

import type { AppState } from '../store'
export * from '../reducers/events'

//  ---------------------------------

//  selectors
export const getEvents = (state: AppState) => state[BRANCH]


//  utils

// export const subscribe = (store: AppStore) => {
//   store.subscribe(() => {
//     // const action: AnyAction = store.getState().LAST_ACTION
//     const action = getStack().top()
//     if (action?.type === STATUS_LOADED || action?.type === WS_RECEIVED) {
//       store.dispatch({
//         type: EVENTS_ADD,
//         payload: action//.payload as AppAction
//       })
//     }
//   })
// }
