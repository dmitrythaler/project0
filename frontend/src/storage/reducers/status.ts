import {
  STATUS_BRANCH as BRANCH,
  STATUS_FETCH,
  STATUS_LOADED,
  STATUS_ERROR
 } from '@p0/common/constants'

import type { AnyAction } from 'redux'
import type { IAPIError, AppStatus } from '@common/types'

//  ----------------------------------------------------------------------------------------------//

export type AppStatusData = {
  status: AppStatus
  processing: boolean
  error?: IAPIError
}

//  ----------------------------------------------------------------------------------------------//
//  redicer

const initialStatus: AppStatusData = {
  status: {
    desc: '',
    version: '',
    env: '',
    hash: '',
    db: '',
  },
  processing: false,
}

export const reducer = (state = initialStatus, action: AnyAction): AppStatusData => {
  switch (action.type) {
    case STATUS_FETCH: {
      state = { ...state }
      state.processing = true
      return state
    }

    case STATUS_LOADED: {
      return {
        status: action.payload,
        processing: false
      }
    }

    case STATUS_ERROR: {
      state = { ...state }
      state.processing = false
      state.error = action.payload
      return state
    }

    default:
      return state
  }
}
