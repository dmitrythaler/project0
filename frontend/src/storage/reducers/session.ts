import { createReducer, createAction } from '@reduxjs/toolkit'
import {
  SESSION_BRANCH as BRANCH,
  SESSION_REQUEST,
  SESSION_STARTED,
  SESSION_EXPIRED,
  SESSION_ENDED,
  SESSION_UPDATED,
  SESSION_ERROR,
} from '@p0/common/constants'

import { getExpCookie, cleanCookies } from '../utils'

import type * as RT from '@reduxjs/toolkit'
import type { User } from '@p0/dal'
import type { IAPIError } from '@p0/common/types'

//  ---------------------------------
// types and consts
export type SessionData = {
  processing: boolean
  data: {
    user: User|null
    exp: number|null
    wsToken: string|null
  }
  error?: IAPIError
}

export type UserCreds = {
  email: string
  password: string
}

const SS_DATA = BRANCH + '/DATA'
const emptyData: SessionData['data'] = {
  user: null,
  exp: 0,
  wsToken: null
}

//  ---------------------------------
// utils
const loadSessionData = (): SessionData['data'] => {
  const data = sessionStorage.getItem(SS_DATA)
  if (!data) {
    // no stored session
    return emptyData
  }

  const exp = getExpCookie()
  if (!exp || exp < Date.now()) {
    // session expired | cookie not found
    sessionStorage.removeItem(SS_DATA)
    return emptyData
  }

  const { user, wsToken } = JSON.parse(data)
  return  { user, exp, wsToken }
}

//  ---------------------------------
// actions
export const processingStartedAction = createAction<string>(SESSION_REQUEST)
export const processingErrorAction = createAction<IAPIError>(SESSION_ERROR)
export const sessionStartedAction = createAction<SessionData['data']>(SESSION_STARTED)
export const sessionUpdatedAction = createAction<number|null>(SESSION_UPDATED)
export const sessionEndedAction = createAction(SESSION_ENDED)
export const sessionExpiredAction = createAction(SESSION_EXPIRED)

//  ----------------------------------------------------------------------------------------------//
// reducer

const sessionReducer: RT.Reducer = createReducer(
  {
    processing: false,
    data: loadSessionData()
  } as SessionData,
  (builder) => {
    builder.addCase(processingStartedAction, (state/* , action */) => {
      state.processing = true
      state.error = undefined
    })
    builder.addCase(processingErrorAction, (state, action) => {
      state.processing = false
      state.error = action.payload
    })
    builder.addCase(sessionStartedAction, (state, action) => {
      state.processing = false
      state.data = action.payload
      const { user, wsToken } = action.payload
      sessionStorage.setItem(SS_DATA, JSON.stringify({ user, wsToken }))
    })
    builder.addCase(sessionUpdatedAction, (state, action) => {

    })
    builder.addCase(sessionEndedAction, (state/* , action */) => {
      state.processing = false
      state.data = emptyData
      sessionStorage.removeItem(SS_DATA)
      cleanCookies()
    })
    builder.addCase(sessionExpiredAction, (state/* , action */) => {
      state.processing = false
      state.data = emptyData
      sessionStorage.removeItem(SS_DATA)
      cleanCookies()
    })
  }
)

export default sessionReducer
