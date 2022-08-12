// import axios from 'axios'
import { apiInstance } from '../config'

export const BRANCH = 'STATUS'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

export const STATUS_FETCH = 'STATUS/FETCH'
export const STATUS_LOADED = 'STATUS/LOADED'
export const STATUS_ERROR = 'STATUS/ERROR'

//  ---------------------------------
//  selectors

export function getAppStatus(state) {
  return state[BRANCH].appStatus
}

export function getRequestStatus(state) {
  return state[BRANCH].status
}

//  ----------------------------------------------------------------------------------------------//
//  async action creators

export function fetchAppStatus() {
  return async dispatch => {
    dispatch({
      type: STATUS_FETCH
    })

    try {
      const resp = await apiInstance.get('/status')
      dispatch({
        type: STATUS_LOADED,
        payload: resp.data
      })
    } catch(err) {
      dispatch({ type: STATUS_ERROR, payload: err })
    }
  }
}


//  ----------------------------------------------------------------------------------------------//
//  redicer
const initialState = {
  status: 'idle',
  appStatus: {}
}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case STATUS_FETCH: {
      state = { ...state }
      state.status = 'loading'
      return state
    }

    case STATUS_LOADED: {
      state = { ...state }
      state.status = 'loaded'
      state.appStatus = action.payload
      return state
    }

    case STATUS_ERROR: {
      return { status: 'error', courses: [] }
    }

    default:
      return state
  }
}

