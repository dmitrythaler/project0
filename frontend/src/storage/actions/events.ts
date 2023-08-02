import {
  EVENTS_BRANCH as BRANCH,
  EVENTS_ADD,
  EVENTS_CLEAR,
  WS_RECEIVED,
  STATUS_LOADED
} from '@p0/common/constants'
import { getStack } from '../actionsstack'

import type { RootState, AppStore } from '../store'
import type { AppAction } from '@common/types'

//  ----------------------------------------------------------------------------------------------//
//  selectors

export const getEvents = (state: RootState) => state[BRANCH]

//  ---------------------------------
//  action creators

export const clearEventsAction = () => ({ type: EVENTS_CLEAR })

//  ---------------------------------
//  utils

export const subscribe = (store: AppStore) => {
  store.subscribe(() => {
    // const action: AnyAction = store.getState().LAST_ACTION
    const action = getStack().top()
    if (action?.type === STATUS_LOADED || action?.type === WS_RECEIVED) {
      store.dispatch({
        type: EVENTS_ADD,
        payload: action//.payload as AppAction
      })
    }
  })
}
