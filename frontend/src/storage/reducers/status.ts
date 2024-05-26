import { createReducer, createAction } from '@reduxjs/toolkit'
import {
  STATUS_FETCH,
  STATUS_LOADED,
  STATUS_ERROR
} from '@p0/common/constants'

import type * as RT from '@reduxjs/toolkit'
import type { IAPIError, AppStatus } from '@p0/common/types'

//  ---------------------------------
// types
export type AppStatusData = {
  status: AppStatus
  processing: boolean
  error?: IAPIError
}

// actions
export const statusLoadingStartedAction = createAction(STATUS_FETCH)
export const statusLoadedAction = createAction<AppStatus>(STATUS_LOADED)
export const statusErrorAction = createAction<IAPIError>(STATUS_ERROR)

// reducer

const statusReducer: RT.Reducer = createReducer(
  {
    status: {
      desc: '',
      version: '',
      env: '',
      hash: '',
      db: '',
    },
    processing: false,
  } as AppStatusData,
  (builder) => {
    builder.addCase(statusLoadingStartedAction, (state, action) => {
      state.processing = true
    })
    builder.addCase(statusLoadedAction, (state, action) => {
      state.processing = false
      state.status = action.payload
      state.error = undefined
    })
    builder.addCase(statusErrorAction, (state, action) => {
      state.processing = false
      state.error = action.payload
    })

  }
)

export default statusReducer
