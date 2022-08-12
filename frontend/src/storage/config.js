// import axios from 'axios'
import { apiInstance } from '../config'
import { sendMsg } from './message'

export const BRANCH = 'CONFIG'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

export const CONFIG_FETCH = 'CONFIG/FETCH'
export const CONFIG_UPDATE = 'CONFIG/UPDATE'
export const CONFIG_LOADED = 'CONFIG/LOADED'
export const CONFIG_UPDATED = 'CONFIG/UPDATED'
export const CONFIG_ERROR = 'CONFIG/ERROR'

//  ---------------------------------
//  selectors

export function getConfig(state) {
  return state[BRANCH].config
}

//  ----------------------------------------------------------------------------------------------//
//  async action creators

const sendErrorMsg = err => {
  const data = err.response.data || err.response || err
  return sendMsg({
    header: 'Config Operation error',
    body: `${data.message} (Code: ${data.code}, id: ${data.id})`,
    timeout: 0
  })
}

//  ---------------------------------
export function fetchConfig() {
  return async dispatch => {
    dispatch({
      type: CONFIG_FETCH
    })

    try {
      const { data } = await apiInstance.get('/config')
      dispatch({
        type: CONFIG_LOADED,
        payload: data.config
      })
    } catch(err) {
      dispatch(sendErrorMsg(err))
      dispatch({ type: CONFIG_ERROR, payload: err })
    }
  }
}

export function updateConfig(config) {
  return async dispatch => {
    dispatch({
      type: CONFIG_UPDATE
    })

    try {
      const { data } = await apiInstance.put(`/config`, {
        data: config
      })
      dispatch({
        type: CONFIG_UPDATED,
        payload: data.config
      })
      dispatch(sendMsg(`Configuration updated.`))
    } catch (err) {
      dispatch({ type: CONFIG_ERROR, payload: err.response.data })
      dispatch(sendErrorMsg(err))
    }
  }
}
//  ----------------------------------------------------------------------------------------------//
//  redicer
const initialState = {
  status: '',
  config: {}
}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case CONFIG_UPDATE:
    case CONFIG_FETCH: {
      state = { ...state }
      state.status = action.type
      return state
    }

    case CONFIG_LOADED: {
      state = { ...state }
      state.status = action.type
      state.config = action.payload
      return state
    }

    case CONFIG_UPDATED: {
      state = { ...state }
      state.status = action.type
      state.config = action.payload
      return state
    }

    case CONFIG_ERROR: {
      return {
        status: action.type,
        config: {}
      }
    }

    default:
      return state
  }
}

