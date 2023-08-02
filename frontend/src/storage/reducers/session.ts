import {
  SESSION_BRANCH as BRANCH,
  SESSION_LOGIN,
  SESSION_LOGOUT,
  SESSION_LOADED,
  SESSION_STARTED,
  SESSION_EXPIRED,
  SESSION_ENDED,
  SESSION_UPDATED,
  SESSION_ERROR,
} from '@p0/common/constants'

import type { AnyAction } from 'redux'
import type { User } from '@p0/dal'
import type { IAPIError } from '@common/types'

//  ----------------------------------------------------------------------------------------------//
// types and consts

export type SessionData = {
  user: User.Self | null
  loggedIn: boolean
  processing: string|false
  exp: number
  wsToken: string|null
  error?: IAPIError
}

const zeroSession: SessionData = {
  user: null,
  loggedIn: false,
  processing: false,
  exp: 0,
  wsToken: null
}

//  ----------------------------------------------------------------------------------------------//
//  redicer

export const reducer = (state = zeroSession, action: AnyAction): SessionData => {
  switch (action.type) {

    case SESSION_LOGOUT:
    case SESSION_LOGIN: {
      return {
        ...state,
        processing: action.type
      }
    }

    case SESSION_LOADED:
    case SESSION_STARTED: {
      return {
        ...state,
        processing: false,
        ...action.payload //  { user, exp, wsToken }
      }
    }

    case SESSION_UPDATED: {
      return {
        ...state,
        processing: false,
        ...action.payload //  { exp }
      }
    }

    case SESSION_ENDED:
    case SESSION_EXPIRED: {
      return { ...zeroSession }
    }

    case SESSION_ERROR: {
      return {
        ...state,
        processing: false,
        error: action.payload
      }
    }

    default:
      return state
  }
}

