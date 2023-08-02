import { errorPayload, apiInstance } from '@common'
import {
  STATUS_BRANCH as BRANCH,
  STATUS_FETCH,
  STATUS_LOADED,
  STATUS_ERROR
} from '@p0/common/constants'
import { sendErrorMessageAction } from './messages'

import type { IAPIError, AppStatus } from '@common/types'
import type { ErrorPayload } from '@common'
import type { RootState, AppThunk, AppThunkDispatch } from '../store'

//  ---------------------------------
const ROUTE = '/status'

//  ---------------------------------
//  selectors

export const getAppStatus = (state: RootState): AppStatus => state[BRANCH].status
export const isLoading = (state: RootState): boolean => state[BRANCH].processing
export const getError = (state: RootState): IAPIError|null =>
  state[BRANCH].error
    ? errorPayload(state[BRANCH].error)
    : null

//  ----------------------------------------------------------------------------------------------//
//  action creators

export const fetchAppStatusAction = (): AppThunk =>
  async (dispatch: AppThunkDispatch) => {
    dispatch({ type: STATUS_FETCH })
    try {
      const { data } = await apiInstance.get(ROUTE)
      dispatch({
        type: STATUS_LOADED,
        payload: data.status as AppStatus
      })
    } catch(err) {
      const error = errorPayload(<ErrorPayload>err)
      dispatch({ type: STATUS_ERROR, payload: error })
      dispatch(sendErrorMessageAction(error))
    }
  }
