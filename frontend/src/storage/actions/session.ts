import {
  EXPIRY_COOKIE_NAME,
  TOKEN_COOKIE_NAME,
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
import { sendMessageAction, sendErrorMessageAction } from './messages'
import { errorPayload, apiInstance } from '@common'
import { getStack } from '../actionsstack'

import type { User } from '@p0/dal'
import type { ErrorPayload } from '@common'
import type { RootState, AppThunk, AppThunkDispatch, AppStore } from '../store'

//  ----------------------------------------------------------------------------------------------//
// types

export type UserCreds = {
  email: string
  password: string
}

//  ---------------------------------
//  actions and creators

const ROUTE = '/login'
const SS_DATA = BRANCH + '/DATA'

//  ---------------------------------
//  selectors

export const getUser = (state: RootState) => state[BRANCH].user
export const getExpiration = (state: RootState) => state[BRANCH].exp
export const getWsToken = (state: RootState) => state[BRANCH].wsToken
export const isProcessing = (state: RootState) => state[BRANCH].processing
export const getError = (state: RootState) =>
  state[BRANCH].error
    ? errorPayload(state[BRANCH].error!)
    : null

//  ----------------------------------------------------------------------------------------------//
//  utils

const handleError = (err: unknown, dispatch: AppThunkDispatch) => {
  const error = errorPayload(<ErrorPayload>err)
  dispatch(sendErrorMessageAction(error))
  dispatch({ type: SESSION_ERROR, payload: error })
}

export const getExpCookie = (): number | null => {
  const cookies = document.cookie
  const found = cookies.split(';').find(c => c.trim().startsWith(EXPIRY_COOKIE_NAME))
  return (found ? parseFloat(found.split('=')[1]) : null)/*possibly NaN*/ || null
}

//  ----------------------------------------------------------------------------------------------//
//  Session handling class

class Session {
  private timer: NodeJS.Timeout | null = null
  private store: AppStore

  constructor(store: AppStore) {
    this.store = store
    this.timer = null
  }

  private cleanUp() {
    sessionStorage.removeItem(SS_DATA)
    // kill cookies
    document.cookie = `${EXPIRY_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }

  private load() {
    const data = sessionStorage.getItem(SS_DATA)
    if (!data) {
      // no stored session
      return this.cleanUp()
    }

    // session expired | cookie not found
    const exp = getExpCookie()
    if (!exp || exp < Date.now()) {
      return this.cleanUp()
    }

    const { user, wsToken } = JSON.parse(data)
    this.store.dispatch({
      type: SESSION_LOADED,
      payload: { user, exp, wsToken }
    })
  }

  // intercepts successful API requests and update session
  private setAPIInterceptor() {
    apiInstance.interceptors.response.use(resp => {
      const exp = getExpCookie()
      const storedExp = getExpiration(this.store.getState())
      if (storedExp !== exp) {
        this.store.dispatch({
          type: SESSION_UPDATED,
          payload: { exp }
        })
        this.reset(exp)
      }
      return resp
    })
  }

  private reset(exp: number | null) {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    if (!exp) {
      this.timer = null
      return
    }
    const dispatch: AppThunkDispatch = this.store.dispatch
    this.timer = setTimeout(() => {
      dispatch({ type: SESSION_EXPIRED })
      dispatch(sendMessageAction({
        header: 'Session expired',
        body: 'Session is expired due to inactivity. Please login again.',
        timeout: 0
      }))
      this.cleanUp()
    }, exp - Date.now())
  }

  subscribe() {
    this.load()
    this.setAPIInterceptor()

    // subscribe to handle actions created outside of Session
    this.store.subscribe(() => {
      const action = getStack().top()
      if (action?.type === SESSION_STARTED) {
        const { user, exp, wsToken } = action.payload as { user: User.Self, exp: number, wsToken: string }
        this.reset(exp)
        sessionStorage.setItem(SS_DATA, JSON.stringify({ user, wsToken }))
      } else if (action?.type === SESSION_ENDED) {
        this.cleanUp()
      }
    })
  }

  //  ---------------------------------
  private static inst_: Session|null = null
  static getSession = (store: AppStore): Session => Session.inst_ || (Session.inst_ = new Session(store))
}


//  ----------------------------------------------------------------------------------------------//
//  async action creators

export const loginUserAction = (creds: UserCreds): AppThunk =>
  async (dispatch: AppThunkDispatch) => {
    dispatch({ type: SESSION_LOGIN })
    try {
      const resp = await apiInstance.post(ROUTE, {
        data: { creds }
      })
      const { user, wsToken } = resp.data
      const exp = getExpCookie()

      dispatch({
        type: SESSION_STARTED,
        payload: { user, exp, wsToken }
      })
    } catch(err) {
      handleError(err, dispatch)
    }
  }

export const logoutUserAction = (): AppThunk =>
  async (dispatch: AppThunkDispatch) => {
    dispatch({ type: SESSION_LOGOUT })
    try {
      await apiInstance.delete( ROUTE )
      dispatch({ type: SESSION_ENDED })
    } catch(err) {
      handleError(err, dispatch)
    }
  }

export const getSession = Session.getSession

