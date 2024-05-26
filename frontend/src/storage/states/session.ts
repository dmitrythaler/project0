import {
  SESSION_BRANCH as BRANCH,
  SESSION_LOGIN,
  SESSION_LOGOUT,
} from '@p0/common/constants'

import { sendErrorMessage } from './messages'
import { errorPayload, apiInstance } from '@common'
import { getExpCookie } from '../utils'
import {
  processingErrorAction,
  processingStartedAction,
  sessionStartedAction,
  sessionEndedAction
} from '../reducers/session'

import type { AppState, AppDispatch } from '../store'
import type { UserCreds } from '../reducers/session'
import type { ErrorPayload } from '@common'

export * from '../reducers/session'

//  ---------------------------------
// consts and types
const ROUTE = '/login'

//  ---------------------------------
// selectors
export const getUser = (state: AppState) => state[BRANCH].data.user
export const getExpiration = (state: AppState) => state[BRANCH].data.exp
export const getWsToken = (state: AppState) => state[BRANCH].data.wsToken
export const isProcessing = (state: AppState) => state[BRANCH].processing
export const getError = (state: AppState) => state[BRANCH].error && errorPayload(state[BRANCH].error!)

//  ---------------------------------
// utils
const handleError = (err: unknown, dispatch) => {
  const error = errorPayload(<ErrorPayload>err)
  dispatch(sendErrorMessage(error))
  dispatch(processingErrorAction(error))
}

// thunks

export const loginUser = (creds: UserCreds) =>
  async (dispatch: AppDispatch) => {
    dispatch(processingStartedAction(SESSION_LOGIN))
    try {
      const resp = await apiInstance.post(ROUTE, {
        data: { creds }
      })
      const { user, wsToken } = resp.data
      const exp = getExpCookie()

      dispatch(sessionStartedAction({ user, exp, wsToken }))
    } catch (err) {
      handleError(err, dispatch)
    }
  }

export const logoutUser = () =>
  async (dispatch: AppDispatch) => {
    dispatch(processingStartedAction(SESSION_LOGOUT))
    try {
      await apiInstance.delete(ROUTE)
      dispatch(sessionEndedAction())
    } catch (err) {
      handleError(err, dispatch)
    }
  }
