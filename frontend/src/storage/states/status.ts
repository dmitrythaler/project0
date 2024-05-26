import {
  STATUS_BRANCH as BRANCH,
  STATUS_ERROR
} from '@p0/common/constants'
import { errorPayload, apiInstance } from '@common'
import { sendErrorMessage } from './messages'
import { statusLoadingStartedAction, statusLoadedAction } from '../reducers/status'

import type { IAPIError, AppStatus } from '@p0/common/types'
import type { ErrorPayload } from '@common'
import type { AppDispatch, AppState } from '../store'

export * from '../reducers/status'

//  ---------------------------------
// selectors
export const getAppStatus = (state: AppState): AppStatus => state[BRANCH].status
export const isLoading = (state: AppState): boolean => state[BRANCH].processing
export const getError = (state: AppState): IAPIError | undefined => state[BRANCH].error && errorPayload(state[BRANCH].error)

// thunks
const ROUTE = '/status'

export const fetchAppStatus = () =>
  async (dispatch: AppDispatch) => {
    dispatch(statusLoadingStartedAction())
    try {
      const { data } = await apiInstance.get(ROUTE)
      dispatch(statusLoadedAction(data.status as AppStatus))
    } catch (err) {
      const error = errorPayload(<ErrorPayload>err)
      dispatch({ type: STATUS_ERROR, payload: error })
      dispatch(sendErrorMessage(error))
    }
  }
