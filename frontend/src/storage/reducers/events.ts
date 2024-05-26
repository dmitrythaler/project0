import { createReducer, createAction } from '@reduxjs/toolkit'
import {
  EVENTS_ADD,
  EVENTS_CLEAR,
} from '@p0/common/constants'

import type * as RT from '@reduxjs/toolkit'
import type { AppAction } from '@p0/common/types'

export type AppActionExt = AppAction & {
  time?: Date | null
}
//  ---------------------------------

// actions
export const eventAddAction = createAction<AppActionExt>(EVENTS_ADD)
export const eventsClearAction = createAction(EVENTS_CLEAR)

const eventsReducer: RT.Reducer = createReducer(
  [] as AppActionExt[],
  (builder) => {
    builder.addCase(eventAddAction, (state, action) => {
      state.push({
        time: new Date(),
        ...action.payload,
      })
    })
    builder.addCase(eventsClearAction, (state/* , action */) => {
      state.length = 0
    })

  }
)

export default eventsReducer
