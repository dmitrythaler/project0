import { apiInstance } from '../config'
import { sendMsg } from './message'

export const BRANCH = 'USERS'

//  ----------------------------------------------------------------------------------------------//
//  actions and creators

export const USERS_FETCH = 'USERS/FETCH'
export const USERS_LOADED = 'USERS/LOADED'
export const USERS_ERROR = 'USERS/ERROR'
export const USER_CREATE = 'USER/CREATE'
export const USER_CREATED = 'USER/CREATED'
export const USER_UPDATE = 'USER/UPDATE'
export const USER_UPDATED = 'USER/UPDATED'
export const USER_DELETE = 'USER/DELETE'
export const USER_DELETED = 'USER/DELETED'
export const USER_ERROR = 'USER/ERROR'

//  ---------------------------------
//  selectors

export function getUsers(state) {
  return state[BRANCH].users
}

export function getRequestStatus(state) {
  return state[BRANCH].status
}

export function getUsersLoading(state) {
  return state[BRANCH].status === USERS_FETCH
}

export function getLastRequestError(state) {
  if(state[BRANCH].status !== USER_ERROR && state[BRANCH].status !== USERS_ERROR) {
    return null
  }
  const err = state[BRANCH].error
  return err.response?.data || err.response || err
}

//  ----------------------------------------------------------------------------------------------//
//  async action creators

const sendErrorMsg = err => {
  const data = err.response.data || err.response || err
  return sendMsg({
    header: 'User Operation error',
    body: `${data.message} (Code: ${data.code}, id: ${data.id})`,
    timeout: 0
  })
}

//  ---------------------------------

export function fetchUsers() {
  return async dispatch => {
    dispatch({
      type: USERS_FETCH
    })

    try {
      const resp = await apiInstance.get('/user/list')
      dispatch({
        type: USERS_LOADED,
        payload: resp.data.users
      })
    } catch(err) {
      dispatch({ type: USERS_ERROR, payload: err.response.data })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function createUser(user) {
  return async dispatch => {
    dispatch({
      type: USER_CREATE
    })

    try {
      const { email, lastName, firstName, password, isActive, role } = user
      const resp = await apiInstance.post('/user', {
        data: {
          email, lastName, firstName, password, isActive, role
        }
      })
      dispatch({
        type: USER_CREATED,
        payload: resp.data.user
      })
      dispatch(sendMsg(`The user(${firstName} ${lastName}) created.`))
    } catch(err) {
      dispatch({ type: USER_ERROR, payload: err.response.data })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function updateUser(user) {
  return async dispatch => {
    dispatch({
      type: USER_UPDATE
    })

    try {
      const { uuid, email, lastName, firstName, lastLogin, updatedAt, createdAt, ...rest } = user
      const resp = await apiInstance.patch(`/user/${uuid}`, {
        data: {
          email, lastName, firstName, ...rest
        }
      })
      dispatch({
        type: USER_UPDATED,
        payload: resp.data.user
      })
      dispatch(sendMsg(`The user(${firstName} ${lastName}) updated.`))
    } catch(err) {
      dispatch({ type: USER_ERROR, payload: err.response.data })
      dispatch(sendErrorMsg(err))
    }
  }
}

export function deleteUser(user) {
  return async dispatch => {
    dispatch({
      type: USER_DELETE
    })

    try {
      await apiInstance.delete(`/user/${user.uuid}`)
      dispatch({
        type: USER_DELETED,
        payload: user.uuid
      })
      dispatch(sendMsg(`The user(${user.firstName} ${user.lastName}) deleted.`))
    } catch(err) {
      dispatch({ type: USER_ERROR, payload: err.response.data })
      dispatch(sendErrorMsg(err))
    }
  }
}

//  ----------------------------------------------------------------------------------------------//
//  redicer
const initialState = {
  status: '',
  error: null,
  users: []
}

export default function reducer(state = initialState, action) {
  switch (action.type) {

    case USERS_FETCH:
    case USER_CREATE:
    case USER_DELETE:
    case USER_UPDATE: {
      return {
        ...state,
        status: action.type
      }
    }

    case USERS_LOADED: {
      return {
        ...state,
        status: USERS_LOADED,
        users: action.payload
      }
    }

    case USERS_ERROR: {
      return {
        ...state,
        status: action.type,
        error: action.payload,
        users: []
      }
    }

    case USER_CREATED: {
      return {
        ...state,
        status: action.type,
        users: [ ...state.users, action.payload]
      }
    }

    case USER_UPDATED: {
      const users = [...state.users]
      const idx = users.findIndex(c => c.uuid === action.payload.uuid)
      if (idx !== -1) {
        users[idx] = action.payload
      } else {
        console.error(action.type + ', something stupid: user not found', action.payload)
      }
      return {
        ...state,
        status: action.type,
        users
      }
    }

    case USER_DELETED: {
      const users = [...state.users]
      const idx = users.findIndex(c => c.uuid === action.payload)
      if (idx !== -1) {
        users.splice(idx, 1)
      } else {
        console.error('USER_DELETED, something stupid: user not found', action.payload)
      }
      return {
        ...state,
        status: action.type,
        users
      }
    }

    case USER_ERROR: {
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

