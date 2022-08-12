import { apiInstance } from '../config'
import { sendMsg } from './message'

export const BRANCH = 'SESSION'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

export const SESSION_LOGIN = 'SESSION/LOGIN'
export const SESSION_LOGOUT = 'SESSION/LOGOUT'
export const SESSION_LOADED = 'SESSION/LOADED'
export const SESSION_STARTED = 'SESSION/STARTED'
export const SESSION_EXPIRED = 'SESSION/EXPIRED'
export const SESSION_ENDED = 'SESSION/ENDED'
export const SESSION_UPDATED = 'SESSION/UPDATED'
export const SESSION_ERROR = 'SESSION/ERROR'

//  ---------------------------------
//  selectors

export function getUser(state) {
  return state[BRANCH].user
}

export function getExpiration(state) {
  return state[BRANCH].exp
}

export function getRequestStatus(state) {
  return state[BRANCH].status
}

export function getLastRequestError(state) {
  if(state[BRANCH].status !== SESSION_ERROR) {
    return null
  }
  const err = state[BRANCH].error
  return err.response?.data || err.response || err
}

//  ----------------------------------------------------------------------------------------------//
//  async action creators

export function loginUser(creds) {
  return async dispatch => {
    dispatch({
      type: SESSION_LOGIN
    })

    try {
      const resp = await apiInstance.post(`/login`, {
        data: { creds }
      })
      const { user } = resp.data
      const exp = getExpCookie()
      dispatch({
        type: SESSION_STARTED,
        payload: { user, exp }
      })
    } catch(err) {
      const data = err.response.data
      dispatch({
        type: SESSION_ERROR,
        payload: data
      })
      dispatch(sendMsg({
        header: 'Session error',
        body: `${data.message} (Code: ${data.code}, id: ${data.id})`,
        timeout: 0
      }))
    }
  }
}

export function logoutUser() {
  return async dispatch => {
    dispatch({
      type: SESSION_LOGOUT
    })

    try {
      await apiInstance.delete(`/login`)
      dispatch({
        type: SESSION_ENDED
      })
    } catch(err) {
      const data = err.response.data
      dispatch({
        type: SESSION_ERROR,
        payload: data
      })
      dispatch(sendMsg({
        header: 'Session error',
        body: `${data.message} (Code: ${data.code}, id: ${data.id})`,
        timeout: 0
      }))
    }
  }
}

//  ----------------------------------------------------------------------------------------------//
//  utils and redicer

const SS_DATA = BRANCH + '_DATA'

const getExpCookie = () => {
  const cookies = document.cookie
  const found = cookies.split(';').find(c => c.trim().startsWith('exp'))
  return found ? parseFloat(found.split('=')[1]) : null
}

const loadSessionSS = store => {
  const data = sessionStorage.getItem(SS_DATA)
  const exp = getExpCookie()


  if (!data) {
    // no stored session
    return
  }

  // session expired | cookie not found
  if (!exp || exp < Date.now()) {
    sessionStorage.removeItem(SS_DATA)
    // kill exp cookie
    document.cookie = 'exp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    return
  }

  const user = JSON.parse(data)
  console.log('+++ SS loader, gotcha', user)
  store.dispatch({
    type: SESSION_LOADED,
    payload: { user, exp }
  })
}

// intercepts successful API requests and update session
const setAPIInterceptor = store => {
  apiInstance.interceptors.response.use(resp => {

    const exp = getExpCookie()
    const storedExp = getExpiration(store.getState())

    if (storedExp !== exp) {
      store.dispatch({
        type: SESSION_UPDATED,
        payload: exp
      })
    }

    return resp
  })
}

let resetSessionTimer = null

export const initSessionInfra = store => {
  let SESSION_TIMER = null

  resetSessionTimer = (exp) => {
    if (SESSION_TIMER) {
      clearTimeout(SESSION_TIMER)
    }
    if (!exp) {
      SESSION_TIMER = null
      return
    }
    SESSION_TIMER = setTimeout(() => {
      store.dispatch({
        type: SESSION_EXPIRED
      })
      store.dispatch(sendMsg({
        header: 'Session expired',
        body: 'Please login again',
        timeout: 5
      }))
    }, exp - Date.now())
  }

  loadSessionSS(store)
  setAPIInterceptor(store)
}


//  ---------------------------------

const initialState = {
  status: '',
  error: null,
  user: null,
  exp: 0
}

export default function reducer(state = initialState, action) {
  switch (action.type) {

    case SESSION_LOGOUT:
    case SESSION_LOGIN: {
      return {
        ...state,
        status: action.type
      }
    }

    case SESSION_LOADED: {
      resetSessionTimer && resetSessionTimer(action.payload.exp)
      return {
        ...state,
        status: action.type,
        ...action.payload
      }
    }

    case SESSION_STARTED: {
      sessionStorage.setItem(SS_DATA, JSON.stringify(action.payload.user))
      resetSessionTimer && resetSessionTimer(action.payload.exp)
      return {
        ...state,
        status: action.type,
        ...action.payload
      }
    }

    case SESSION_UPDATED: {
      resetSessionTimer && resetSessionTimer(action.payload)
      return {
        ...state,
        status: action.type,
        exp: action.payload
      }
    }

    case SESSION_ENDED:
    case SESSION_EXPIRED: {
      sessionStorage.removeItem(SS_DATA)
      return {
        ...state,
        status: action.type,
        user: null,
        exp: 0
      }
    }

    case SESSION_ERROR: {
      return {
        ...state,
        status: action.type,
        error: action.payload
      }
    }

    default:
      return state
  }
}

